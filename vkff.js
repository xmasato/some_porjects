"use stric"

new Promise(function (resolve) {
    if(document.readyState === 'complete') {
        resolve();
    } else {
        window.onload = resolve;
    }
}).then(function () {
    return new Promise(function (resolve, reject) {
        VK.init({
            apiId: 6054170
        });

        VK.Auth.login(function(response) {
            if(response.session) {
                resolve(response);
            } else {
                reject(new Error('Не удалось подключение'));
            }
        },8);
    });
}).then(function () {
    return new Promise(function (resolve, reject) {
        VK.api('friends.get', {'fields': 'bdate, photo_100'}, function (data) {
            if(data.error) {
                reject (new Error('data.error.error_msg'));
            } else {
                data.response.sort(compare);
                resolve(data);
            }
        });
    });
}).then(function (data) {
    //check localStorage for some data
    if(localStorage.length > 0) {
        listFriends = JSON.parse(localStorage.friends);
    }
    //save object for further work
    myFriends = data;

    if(!listFriends.response[0]){
        createTemplate(data, leftContainer);
    } else {
        myFriends.response = myFriends.response.filter(i => !listFriends.response.some(i2 => i.photo_100 == i2.photo_100));
        createTemplate(myFriends, leftContainer);
        createTemplate(listFriends, rightContainer);
    }

    leftContainer.addEventListener('click', function (e) {
        if(e.target.classList.contains('add')) {
            let src = e.target.closest('div').firstChild.getAttribute('src');

            friendFilter(myFriends, src);
            friendsTablesSort();

            createTemplate(listFriends, rightContainer);
            createTemplate(myFriends, leftContainer);

            friendInput.value = '';
        }

    });

    rightContainer.addEventListener('click', function (e) {

        if(e.target.classList.contains('add')) {
            let src = e.target.closest('div').firstChild.getAttribute('src');

            friendRemove(listFriends, src);
            friendsTablesSort();

            createTemplate(listFriends, rightContainer);
            createTemplate(myFriends, leftContainer);

            filteredFriendInput.value = '';
        }

    });

    friendInput.addEventListener('input', function () {
        showFriends(data, leftContainer, friendInput);
    });

    filteredFriendInput.addEventListener('input', function () {
        showFriends(listFriends, rightContainer, filteredFriendInput);
    });
    // Drag and Drop
    leftContainer.addEventListener('dragstart', function (e) {
        if(e.target.getAttribute('src')) {
            dragSrc = e.target.getAttribute('src');
            dragElem = e.target.parentElement.parentElement;
        }else {
            dragSrc = e.target.firstElementChild.firstElementChild.getAttribute('src');
            dragElem = e.target;
        }
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('el', dragSrc);
    });

    rightContainer.addEventListener('dragstart', function (e) {
        if(e.target.getAttribute('src')) {
            dragSrc = e.target.getAttribute('src');
            dragElem = e.target.parentElement.parentElement;
        }else {
            dragSrc = e.target.firstElementChild.firstElementChild.getAttribute('src');
            dragElem = e.target;
        }
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('el', dragSrc);
    });

    leftContainer.addEventListener('dragover', function (e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        return false;
    });

    rightContainer.addEventListener('dragover', function (e) {
        if (e.preventDefault) e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        return false;
    });

    rightContainer.addEventListener('drop', function (e) {
        if (e.stopPropagation) e.stopPropagation();
        let el = e.dataTransfer.getData('el');

        friendFilter(myFriends, el);
        friendsTablesSort();

        createTemplate(listFriends, rightContainer);
        createTemplate(myFriends, leftContainer);
        friendInput.value = '';
    });

    leftContainer.addEventListener('drop', function (e) {
        if (e.stopPropagation) e.stopPropagation();
        let el = e.dataTransfer.getData('el');

        friendRemove(listFriends, el);
        friendsTablesSort();

        createTemplate(listFriends, rightContainer);
        createTemplate(myFriends, leftContainer);
        friendInput.value = '';
    });
    // Drug and Drop end
    saveButton.addEventListener('click', function (e) {
        e.preventDefault();
        if(listFriends.response) {
            localStorage.friends = JSON.stringify(listFriends);
        }

    });
    // Clear localStorage
    close.addEventListener('click', function () {
       localStorage.clear();
       location.reload();
    });
});

let dragElem;
let dragSrc; // src attribute
let close = document.querySelector('.close');
let listFriends = {response: []}; //right column
let myFriends = {response: []};   // left column
let saveButton = document.querySelector('#save');
let friendInput = document.querySelector('.main-window-input-left input');
let filteredFriendInput = document.querySelector('.main-window-input-right input');
let leftContainer = document.querySelector('#left-container');
let rightContainer = document.querySelector('#right-container');
let friendsInput;
    // Sort two object of friends left and right side
function friendsTablesSort() {
    listFriends.response.sort(compare);
    myFriends.response.sort(compare);
}
    //Show filtered friends when typing in Inputs column
function showFriends(dat, contain, input) {
    friendsInput = input;
    if(input.value) {
        let filteredSearchFriends = {response: []};
        filteredSearchFriends.response = dat.response.filter(filterSort);
        createTemplate(filteredSearchFriends, contain);
    } else {
        createTemplate(dat, contain);
    }
}
    //Filtering friend by filter = src attribute
function friendFilter(friends, filter) {
   myFriends.response = friends.response.filter(function (arr) {
        if(arr.photo_100 === filter) {
            listFriends.response.push(arr);
            return false;
        }
        return true
    });
}
    // Remove friend from right side
function friendRemove(friends, filter) {
    listFriends.response = friends.response.filter(function (arr, index) {
        if(arr.photo_100 === filter) {
            myFriends.response.push(arr);
            return false;
        }
        return true
    });
}
    //filtering friends by input words
function filterSort(data) {
    for( let i = 0; i < friendsInput.value.length; i++) {
        if (!(data.first_name[i].toLowerCase() === friendsInput.value[i].toLowerCase()) && !(data.last_name[i].toLowerCase() === friendsInput.value[i].toLowerCase())) {
            return false;
        }
    }
    return true;
}
    //Generate template by handkebars,  list of friends
function createTemplate(data, contain) {
    let source = entrytemplate.innerHTML;
    let templateFn = Handlebars.compile(source);
    let template = templateFn({list: data.response});

    contain.innerHTML = template;
}
    // Sort friends by alfabet
function compare(a,b) {
    if (a.first_name[0] < b.first_name[0])
        return -1;
    if (a.first_name[0] > b.first_name[0])
        return 1;
    return 0;
}