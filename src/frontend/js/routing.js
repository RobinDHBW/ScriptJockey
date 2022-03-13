page.base('/');
page('/', index);
page('/backroom-poker', dj);

const mainBody = $('#main-body');

function index(){
    mainBody.empty();    

    mainBody.append("<p>Hallo</p>")
    // mainBody.load("./index.html")
}

function dj(){
    mainBody.empty();
    mainBody.append("<p>Hallo</p>")
    //mainBody.load("");
}
