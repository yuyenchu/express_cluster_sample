import path from 'path';

const defaultOptions = {
    prefix: '',
    spacer: 7,
    logger: console.info,
    color: true,
};

const COLORS = {
    yellow: 33,
    green: 32,
    blue: 34,
    red: 31,
    grey: 90,
    magenta: 35,
    clear: 39,
};

const spacer = (x) => (x > 0 ? [...new Array(x)].map(() => ' ').join('') : '');

const colorText = (color, string) => `\u001b[${color}m${string}\u001b[${COLORS.clear}m`;

function colorMethod(method) {
    switch (method) {
        case 'POST':
            return colorText(COLORS.yellow, method);
        case 'GET':
            return colorText(COLORS.green, method);
        case 'PUT':
            return colorText(COLORS.blue, method);
        case 'DELETE':
            return colorText(COLORS.red, method);
        case 'PATCH':
            return colorText(COLORS.grey, method);
        default:
            return method;
    }
}

function getPathFromRegex(regexp) {
    return regexp
        .toString()
        .replace('/^', '')
        .replace('?(?=\\/|$)/i', '')
        .replace(/\\\//g, '/')
        .replace('(?:/(?=$))', '');
}

function combineStacks(acc, stack) {
    if (stack.handle.stack) { 
        const routerPath = getPathFromRegex(stack.regexp);
        return [...acc, stack, ...stack.handle.stack.map((stack) => ({ routerPath, ...stack }))];
    } else if (stack.regexp && stack.method && stack.path) { // Express 3 exception
        const routerPath = getPathFromRegex(stack.regexp);
        return [...acc, { route: { stack: [{routerPath, ...stack}] } }];
    }
    return [...acc, stack];
}

function getStacks(app) {
  // Express 3
  if (app.routes) {
    // convert to express 4
    return Object.keys(app.routes)
      .reduce((acc, method) => [...acc, ...app.routes[method]], []);
  }

  // Express 4
  if (app._router && app._router.stack) {
    // console.log(app._router.stack)
    return app._router.stack;
  }

  // Express 4 Router
  if (app.stack) {
    return app.stack;
  }

  // Express 5
  if (app.router && app.router.stack) {
    return app.router.stack;
  }

  return [];
}

// force the middleware to produce an error to locate the file.
async function getMiddlewareFileLine(handler){
    try{
        await handler(undefined);
    } catch(e){
        return e.stack.split('\n')[1];
    }
}

async function listMiddlewares (app, opts){
    const options = { ...defaultOptions, ...opts };
    const logger = options.logger;
    const stacks = getStacks(app);
    const middlewares = await Promise.all(
        stacks
            .reduce((acc, m)=>{
                const routerPath = getPathFromRegex(m.regexp); // include parent path
                return [...acc, m, ...(m.route?.stack?.map((stack) => ({ routerPath, ...stack }))??[]), ...(m.handle?.stack?.map((stack) => ({ routerPath, ...stack }))??[])]
            }, [])
            .filter(m=>m.handle&&!m.route?.stack) // anything that's not a route
            .map(async function (middleware) {
                const mwName = (middleware.handle.name || colorText(COLORS.red, '<anonymous function>'));
                const mwPath = path
                .normalize([
                    options.prefix, 
                    middleware.routerPath??getPathFromRegex(middleware.regexp)
                ].filter((s) => !!s).join(''))
                .trim() ;
                const mwLine = await getMiddlewareFileLine(middleware.handle);
                return [mwName, mwPath, mwLine];
            })
    );
    const maxNameLen = middlewares.reduce((acc,m)=>Math.max(acc, String(m[0]).replace(/\x1B\[\??\d+(;\d+){0,2}[mlhABCDEFGK]/g, '').length), 0);
    const maxPathLen = middlewares.reduce((acc,m)=>Math.max(acc, m[1].length), 0);
    return middlewares.map(function(mw, index) {
        const idxSpace = spacer(options.spacer - index.toString().length -1);
        const nameSpace = spacer(maxNameLen-mw[0].length);
        const pathSpace = spacer(maxPathLen-mw[1].length);
        logger(`${index}.${idxSpace}${mw[0]}  ${nameSpace}${mw[1]}${pathSpace}${mw[2]}`);

        return middlewares;
    });
}

function listRoutes(app, opts) {
    const stacks = getStacks(app).reduce(combineStacks, []);
    const options = { ...defaultOptions, ...opts };
    const logger = options.logger;
    const paths = [];

    if (!stacks) {
        return [];
    }

    for (const stack of stacks) {
        if (!stack.route) {
            continue;
        }
        const routeLogged = {};
        for (const route of stack.route.stack) {
            const method = route.method ? route.method.toUpperCase() : null;
            if (!routeLogged[method] && method) {
                const stackMethod = options.color ? colorMethod(method) : method;
                const idxSpace = spacer(options.spacer - paths.length.toString().length -1);
                const stackSpace = spacer(options.spacer - method.length);
                const stackPath = path
                    .normalize([
                        options.prefix, 
                        stack.routerPath, 
                        stack.route.path, 
                        route.path
                    ].filter((s) => !!s).join(''))
                    .trim();
                logger(`${paths.length}.${idxSpace}${stackMethod}${stackSpace}${stackPath}`);
                paths.push({ method, path: stackPath });
                routeLogged[method] = true;
            }
        }
    }
    
    return paths;
};

export {listMiddlewares, listRoutes};