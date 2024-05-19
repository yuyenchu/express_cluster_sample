const swup = new Swup({
    containers:['#swup','#swup-nav'],
    cache: false,
    plugins: [new SwupPreloadPlugin()]
});

swup.on('pageView', () => {
    onLoad();
});

function onLoad() {
    console.log('on load');
    const button = document.querySelector("[data-open-modal]");
    const dialog = document.querySelector("dialog");
    if (dialog && button) {
        dialog.addEventListener("click", e => {
            const dialogDimensions = dialog.getBoundingClientRect();
            if ((
                e.clientX < dialogDimensions.left ||
                e.clientX > dialogDimensions.right ||
                e.clientY < dialogDimensions.top ||
                e.clientY > dialogDimensions.bottom) &&
                e.target.nodeName !== 'OPTION'
            ) {
                console.log(dialogDimensions, e.clientX, e.clientY, e.target.nodeName)
                dialog.close();
            }
        });
        button.addEventListener("click", function(){
            dialog.showModal();
        });
    }
    
    const signupBtn = document.querySelector('#signUp');
    const signinBtn = document.querySelector('#signIn');
    const container = document.querySelector('#container');
    
    if (signupBtn && signinBtn && container) {
        signupBtn.addEventListener('click', () => {
            container.classList.add("right-panel-active");
        });
        signinBtn.addEventListener('click', () => {
            container.classList.remove("right-panel-active");
        });
    }
}
onLoad();

function logout() {
    fetch("/auth/logout",{
        method: "POST", redirect: "follow"
    })
    .then((res)=>{
        if(res.status!==200) throw new Error("logout fail");
        console.log('logout success, redirecting to ', res.url)
        swup.loadPage({
            url: res.url
        });
    }).catch((err)=>{
        console.error(err);
        swup.loadPage({
            url: '/memo'
        });
    });
}

function markMemo(id) {
    fetch("/api/markMemo",{
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify({id}),
        method: "POST", 
        redirect: "follow"
    })
    .then((res)=>{
        console.log('mark succes, reloading page')
        swup.loadPage({
            url: '/memo'
        });
    }).catch((err)=>{
        console.error(err);
    });
}

function deleteMemo(id) {
    fetch("/api/deleteMemo",{
        headers: new Headers({
            "Content-Type": "application/json",
        }),
        body: JSON.stringify({id}),
        method: "POST", 
        redirect: "follow"
    })
    .then((res)=>{
        console.log('delete success, reloading page')
        swup.loadPage({
            url: '/memo'
        });
    }).catch((err)=>{
        console.error(err);
    });
}