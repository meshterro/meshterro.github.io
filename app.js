firebase.initializeApp({
    messagingSenderId: '262650303733'
});

if ('Notification' in window &&
    'serviceWorker' in navigator &&
    'localStorage' in window &&
    'fetch' in window &&
    'postMessage' in window
) {
    var messaging = firebase.messaging();
    getToken();

    messaging.onMessage(function(payload) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js');
        Notification.requestPermission(function(permission) {
            if (permission === 'granted') {
                navigator.serviceWorker.ready.then(function(registration) {
                    payload.data.data = JSON.parse(JSON.stringify(payload.data));
                    registration.showNotification(payload.data.title, payload.data);
                }).catch(function(error) {
                    sentStatus("E1: " + error);
                });
            }
        });
    });

    messaging.onTokenRefresh(function() {
        messaging.getToken()
            .then(function(refreshedToken) {
                sendTokenToServer(refreshedToken);
            })
            .catch(function(error) {
                sentStatus("E2: " + error);
            });
    });

} else {
    sentStatus("E3: " +
        "HTTPS: " + window.location.protocol === 'https:' +
        "SN: " + 'Notification' in window +
        "SSW: "+ 'serviceWorker' in navigator +
        "SLS" + 'localStorage' in window +
        "SF" + 'fetch' in window +
        "SPM" + 'postMessage' in window);
}

function getToken() {
    messaging.requestPermission()
        .then(function() {
            messaging.getToken()
                .then(function(currentToken) {
                    if (currentToken) {
                        sendTokenToServer(currentToken);
                    } else {
                        setTokenSentToServer(false);
                    }
                })
        })
        .catch(function(error) {
            sentStatus("E4: " + error)
        });
}

function sendTokenToServer(currentToken) {
    console.log("Current token: " + currentToken);
    if (!isTokenSentToServer(currentToken)) {
        // $.post("https://151.80.95.41:5555", {token: currentToken});
        setTokenSentToServer(currentToken);
    } else {
        sentStatus("I1");
    }
}

function isTokenSentToServer(currentToken) {
    return window.localStorage.getItem('storedToken') === currentToken;
}

function setTokenSentToServer(currentToken) {
    if (currentToken) {
        window.localStorage.setItem('storedToken', currentToken);
    } else {
        window.localStorage.removeItem('storedToken');
    }
}

function sentStatus(status) {
    console.log("status: " + status);
    // $.get("https://151.80.95.41:5555", status);
}