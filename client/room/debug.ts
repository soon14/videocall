export function handleError(err) {
    log(err);
}
  
export function log(msg) {
    const entry = document.createElement("p");
    entry.className = "logEntry";
    entry.innerText = msg;
    document.getElementById("log").appendChild(entry);
}

export function updateConnectionStatus(isConnected: boolean) {
    const el = document.getElementById("connection_status");
    if (isConnected) {
        el.innerText ="Connected";
        el.style.color = "green";
    }
    else {
        el.innerText ="Disconnected";
        el.style.color = "red";
    }
}

document.getElementById("toggle_log").onclick = (event) => {
    const log = document.getElementById("log");
    if (log.style.display === 'block') {
        log.style.display = 'none';
    }
    else {
        log.style.display = 'block';
    }
};
