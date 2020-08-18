let socket = io();
socket.on('send user list', (data) => {
    for (let i in data) {
        let jString = '#' + data[i].username;
        $(jString).prop('value', data[i].name + " (online)");
    }
})
socket.on('a user offline', (data) => {
    for (let i in data) {
        let jString = '#' + data[i].username;
        $(jString).prop('value', data[i].name);
    }
})
function chatNow(_id) {
    let data;
    $.ajax({
        url: '/chat-now',
        type: 'POST',
        data: {
            receiverID: _id
        },
        success: (result) => {
            data = result;
        },
        complete: () => {
            $('#receiverID').val(_id);
            $('#chatReceiver').html(data.nameUsernameReceiver)
            $('#chatbox').html('');
            for (let i in data.messages) {
                $('#chatbox').append("<li>" + data.messages[i].senderID.name + " ("
                    + data.messages[i].time + "): "
                    + data.messages[i].content + "</li>");
            }
            let element = document.getElementById("messageBody");
            element.scrollTop = element.scrollHeight;
            socket.emit('send information of chat', _id);
        }
    })
}
function sendMessage() {
    let receiverID = $('#receiverID').val();
    console.log(receiverID);
    if (receiverID == "1") {
        $('#newMessage').hide();
        $('#newMessage').html("<h4>Vui lòng chọn người muốn chat</h4>");
        $('#newMessage').show(200).delay(1500).hide(200);
    } else {
        socket.emit('send message to server', $('#m').val());
    }
}
socket.on('receive message from server', (data) => {
    $('#m').val('');
    $('#chatbox').append("<li>" + data.nameOfSender
        + " (" + data.time + "): " + data.message + "</li>");
    let element = document.getElementById("messageBody");
    element.scrollTop = element.scrollHeight;
});
socket.on('display messages of other receiver', (data) => {
    $('#newMessage').hide();
    $('#newMessage').html("<h5>" + data.nameOfSender + " (bây giờ): " + data.message + "</h5>");
    $('#newMessage').show(200).delay(1500).hide(200);
})

function onTestChange() {
    var key = window.event.keyCode;
    if (key === 13) {
        sendMessage();
    }
    else {
        return true;
    }
}