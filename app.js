firebase.initializeApp({
    messagingSenderId: '262650303733'
});


var token = $('#token');
var form = $('#notification');
var massage_id = $('#massage_id');
var massage_row = $('#massage_row');
var info = $('#info');


if (
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'localStorage' in window &&
    'fetch' in window &&
    'postMessage' in window
) {
    var messaging = firebase.messaging();

    // messaging.getToken()
    //     .then(function(currentToken) {
    //         messaging.deleteToken(currentToken)
    //             .then(function() {
    //                 console.log('Token deleted');
    //                 setTokenSentToServer(false);
    //             });
    //     });


    // already granted
    if (Notification.permission === 'granted') {
        getToken();
    }


            var notification = {};
            form.find('input').each(function () {
                var input = $(this);
                notification[input.attr('name')] = input.val();
            });

            sendNotification(notification);


            // get permission on subscribe only once
            // bt_register.on('click', function() {
            //     getToken();
            // });

            // bt_delete.on('click', function() {
            // Delete Instance ID token.
            // messaging.getToken()
            //     .then(function(currentToken) {
            //         messaging.deleteToken(currentToken)
            //             .then(function() {
            //                 console.log('Token deleted');
            //                 setTokenSentToServer(false);
            //                 Once token is deleted update UI.
            // resetUI();
            // })
            // .catch(function(error) {
            //     showError('Unable to delete token', error);
            // });
            // })
            // .catch(function(error) {
            //     showError('Error retrieving Instance ID token', error);
            // });
            // });

            // form.on('submit', function(event) {
            //     event.preventDefault();
            //
            //     var notification = {};
            //     form.find('input').each(function () {
            //         var input = $(this);
            //         notification[input.attr('name')] = input.val();
            //     });
            //
            //     sendNotification(notification);
            // });

            // handle catch the notification on current page
            messaging.onMessage(function(payload) {
                console.log('Message received', payload);
                // info.show();
                // info_message
                //     .text('')
                //     .append('<strong>'+payload.data.title+'</strong>')
                //     .append('<em>'+payload.data.body+'</em>')
                // ;

                // register fake ServiceWorker for show notification on mobile devices
                navigator.serviceWorker.register('/firebase-messaging-sw.js');
                Notification.requestPermission(function(permission) {
                    if (permission === 'granted') {
                        navigator.serviceWorker.ready.then(function(registration) {
                            // Copy data object to get parameters in the click handler
                            payload.data.data = JSON.parse(JSON.stringify(payload.data));
                            registration.showNotification(payload.data.title, payload.data);
                        }).catch(function(error) {
                            // registration failed :(
                            // showError('ServiceWorker registration failed', error);
                        });
                    }
                });
            });

            // Callback fired if Instance ID token is updated.
            messaging.onTokenRefresh(function() {
                messaging.getToken()
                    .then(function(refreshedToken) {
                        console.log('Token refreshed');
                        // Send Instance ID token to app server.
                        sendTokenToServer(refreshedToken);
                        // updateUIForPushEnabled(refreshedToken);
                    })
                    .catch(function(error) {
                        // showError('Unable to retrieve refreshed token', error);
                    });
            });

} else {
    console.warn('This browser does not support desktop notification.');
    console.log('Is HTTPS', window.location.protocol === 'https:');
    console.log('Support Notification', 'Notification' in window);
    console.log('Support ServiceWorker', 'serviceWorker' in navigator);
    console.log('Support LocalStorage', 'localStorage' in window);
    console.log('Support fetch', 'fetch' in window);
    console.log('Support postMessage', 'postMessage' in window);
}


function getToken() {
    messaging.requestPermission()
        .then(function() {
            // Get Instance ID token. Initially this makes a network call, once retrieved
            // subsequent calls to getToken will return from cache.
            messaging.getToken()
                .then(function(currentToken) {
                    if (currentToken) {
                        sendTokenToServer(currentToken);
                        // updateUIForPushEnabled(currentToken);
                    } else {
                        // showError('No Instance ID token available. Request permission to generate one');
                        // updateUIForPushPermissionRequired();
                        setTokenSentToServer(false);
                    }
                })
                .catch(function(error) {
                    // showError('An error occurred while retrieving token', error);
                    // updateUIForPushPermissionRequired();
                    setTokenSentToServer(false);
                });
        })
        .catch(function(error) {
            showError('Unable to get permission to notify', error);
        });
}


function sendNotification(notification) {
    var key = 'AAAAPSctlPU:APA91bFjbMtVrW7qE282qrbWUZpt4Sn7wROG_cgQgkFFOcgqePw9qkckn5SnKZiNL27ZzGa_kxhpkME-hZ2eU-Dwmh6p8TiR4D1IfvRVzqS2eQw_rIvQeN-iiCzpfB3F7BaIUIqLvXpv';

    console.log('Send notification', notification);

    // hide last notification data
    // info.hide();
    // massage_row.hide();

    messaging.getToken()
        .then(function(currentToken) {
            fetch('https://fcm.googleapis.com/fcm/send', {
                method: 'POST',
                headers: {
                    'Authorization': 'key=' + key,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    // Firebase loses 'image' from the notification.
                    // And you must see this: https://github.com/firebase/quickstart-js/issues/71
                    data: notification,
                    to: currentToken
                })
            }).then(function(response) {
                return response.json();
            }).then(function(json) {
                console.log('Response', json);

                if (json.success === 1) {
                    massage_row.show();
                    massage_id.text(json.results[0].message_id);
                } else {
                    massage_row.hide();
                    massage_id.text(json.results[0].error);
                }
            }).catch(function(error) {
                // showError(error);
            });
        })
        .catch(function(error) {
            // showError('Error retrieving Instance ID token', error);
        });
}

function sendTokenToServer(currentToken) {
    if (!isTokenSentToServer(currentToken)) {
        console.log('Sending token to server: ' + currentToken);
        // send current token to server
        // $.post("https://151.80.95.41:5555", {token: currentToken});
        setTokenSentToServer(currentToken);
    } else {
        console.log('Token already sent to server so won\'t send it again unless it changes');
    }
}

function isTokenSentToServer(currentToken) {
    return window.localStorage.getItem('sentFirebaseMessagingToken') === currentToken;
}

function setTokenSentToServer(currentToken) {
    if (currentToken) {
        window.localStorage.setItem('sentFirebaseMessagingToken', currentToken);
    } else {
        window.localStorage.removeItem('sentFirebaseMessagingToken');
    }
}

// function showError(error, error_data) {
//     if (typeof error_data !== "undefined") {
//         console.error(error, error_data);
//     } else {
//         console.error(error);
//     }
// }


// function updateUIForPushEnabled(currentToken) {
//     console.log(currentToken);
//     token.text(currentToken);
//     bt_register.hide();
//     bt_delete.show();
//     form.show();
// }

// function resetUI() {
//     token.text('');
//     bt_register.show();
//     bt_delete.hide();
//     form.hide();
//     massage_row.hide();
//     info.hide();
// }

// function updateUIForPushPermissionRequired() {
//     bt_register.attr('disabled', 'disabled');
//     resetUI();
// }
