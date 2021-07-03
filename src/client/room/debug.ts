export function handleError(err) {
    log(err);
}

export enum Color {
    RED = "red",
    GREEN = "green",
    YELLOW = "yellow",
    CYAN = "cyan",
}

export function log(msg, color?: Color) {
    const entry = document.createElement("p");
    entry.className = "logEntry";
    entry.innerText = msg;
    entry.style.backgroundColor = color || "white";
    document.getElementById("log").appendChild(entry);
}

export function updateConnectionStatus(isConnected: boolean) {
    const el = document.getElementById("connection_status");
    if (isConnected) {
        // el.innerText ="Connected";
        el.style.backgroundColor = "green";
    }
    else {
        // el.innerText ="Disconnected";
        el.style.backgroundColor = "red";
    }
}

document.getElementById("toggle_log").onclick = (event) => {
    event.stopPropagation(); // prevent window onclick listener
    const log = document.getElementById("log");
    if (log.style.display === 'block') {
        log.style.display = 'none';
    }
    else {
        log.style.display = 'block';
    }
};
