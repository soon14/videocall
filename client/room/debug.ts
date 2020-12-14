export function handleError(err) {
    log(err);
}
  
export function log(msg) {
    const entry = document.createElement("p");
    entry.className = "logEntry";
    entry.innerText = msg;
    document.getElementById("log").appendChild(entry);
}

document.getElementById("toggle_log").onclick = (event) => {
    const log = document.getElementById("log");
    if (log.style.display === 'none') {
        log.style.display = 'block';
    }
    else {
        log.style.display = 'none';
    }
};
