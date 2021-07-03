export function createRemoteVideoElement(remoteUserId) {
  if (document.getElementById(remoteUserId) == null) {
    console.log("creating video element");

    const videoElements = document.getElementsByClassName("remote_video");
    let [low, high] = calcGridDimensions(videoElements.length + 1);
    console.log(low, high);

    const videoElement = document.createElement("video");
    videoElement.autoplay = true;
    videoElement.id = remoteUserId;
    videoElement.className = "remote_video";
    videoElement.style.width = 100 / low + "%";
    videoElement.style.height = 100 / high + "%";
    // videoElement.src = "/test_videos/video_vertical.mp4";
    // videoElement.canPlayType("video/mp4");
    document.getElementById("video_container").appendChild(videoElement);
    resizeVideos(videoElements, low, high);

    // const nameElement = document.createElement("p");
    // nameElement.id = remoteUserId + "_name";
    // // nameElement.className = "remote_name_overlay";
    // nameElement.style.width = 100 / low + "%";
    // nameElement.style.height = 100 / high + "%";
    // nameElement.style.position = "relative";
    // nameElement.style.top = "-" + 100 / low + "%";
    // // nameElement.style.left = "-" + 100 / high + "%";
    // nameElement.innerText = remoteUserId;
    // document.getElementById("video_container").appendChild(nameElement);
  }
}

// Used in combination with calcLargestFactors().
// Called whenever a video is added or removed.
function resizeVideos(videoElements, low, high) {
  if (window.innerWidth > window.innerHeight) {
    const temp = low;
    low = high;
    high = temp;
  }
  for (let i = 0; i < videoElements.length; i++) {
    (videoElements[i] as HTMLVideoElement).style.width = 100 / low + "%";
    (videoElements[i] as HTMLVideoElement).style.height = 100 / high + "%";
  }
}

// returns [a, b], where a <= b. resizeVideos() checks which one should be use for width and height
function calcGridDimensions(x) {
  for (let i = 1; ; i++) {
    const sq = Math.pow(i, 2);
    if (x <= sq) {
      if (x <= sq - i) {
        return [i - 1, i];
      } else {
        return [i, i];
      }
    }
  }
}

// change grid layout when the width becomes larger or smaller than the height
window.onresize = () => {
  const videoElements = document.getElementsByClassName("remote_video");
  if (videoElements.length > 1) {
    const width = parseInt(
      (videoElements[0] as HTMLVideoElement).style.width.slice(0, -1)
    );
    const height = parseInt(
      (videoElements[0] as HTMLVideoElement).style.height.slice(0, -1)
    );
    if (window.innerHeight > window.innerWidth !== height < width) {
      for (let i = 0; i < videoElements.length; i++) {
        (videoElements[i] as HTMLVideoElement).style.width = height + "%";
        (videoElements[i] as HTMLVideoElement).style.height = width + "%";
      }
    }
  }
};


export function removeVideo(source: string) {
  if (document.getElementById(source)) {
    const videoElements = document.getElementsByClassName("remote_video");
    let [low, high] = calcGridDimensions(videoElements.length - 1);
    resizeVideos(videoElements, low, high);

    document
      .getElementById("video_container")
      .removeChild(document.getElementById(source));
  }
}

const showHideElements = [
  document.getElementById("button_container"),
  document.getElementById("toggle_log"),
];
let timeout;
window.onmousemove = showHide;
window.onclick = showHide;

function showHide() {
  if (timeout) {
    clearTimeout(timeout);
  }
  showHideElements.forEach((element) => {
    element.style.opacity = '1';
  });
  timeout = setTimeout(() => {
    showHideElements.forEach((element) => {
      element.style.opacity = '0';
    });
  }, 5000);
};