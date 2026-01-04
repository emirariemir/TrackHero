// modules/utils.js

export const getActiveTab = async () => {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

/**
 * showNameModal(callback)
 * -----------------------
 * Shows a modal dialog to collect user's name before generating certificate
 */
export const showNameModal = (callback) => {
  const modal = document.createElement("div");
  modal.className = "certificate-modal";
  modal.innerHTML = `
    <div class="certificate-modal-content">
      <h2>Claim Your Certificate</h2>
      <p>Enter your name to personalize your certificate</p>
      <input type="text" id="user-first-name" placeholder="First Name" class="name-input" />
      <input type="text" id="user-last-name" placeholder="Last Name" class="name-input" />
      <div class="modal-buttons">
        <button class="modal-cancel-btn">Cancel</button>
        <button class="modal-generate-btn">Generate Certificate</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const firstNameInput = modal.querySelector("#user-first-name");
  const lastNameInput = modal.querySelector("#user-last-name");
  const generateBtn = modal.querySelector(".modal-generate-btn");
  const cancelBtn = modal.querySelector(".modal-cancel-btn");

  firstNameInput.focus();

  const closeModal = () => {
    modal.remove();
  };

  generateBtn.addEventListener("click", () => {
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();

    if (firstName) {
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;
      closeModal();
      callback(fullName);
    } else {
      firstNameInput.style.borderColor = "#ff2e1c";
      firstNameInput.focus();
    }
  });

  cancelBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Enter key to submit
  [firstNameInput, lastNameInput].forEach((input) => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") generateBtn.click();
    });
  });
};

/**
 * generateCertificate(playlistTitle, channelName, totalVideos, userName)
 * ----------------------------------------------------------------------
 * Generates and downloads a certificate for completing a playlist
 * Using HTML Canvas approach - no external library needed
 */
export const generateCertificate = (
  playlistTitle,
  channelName,
  totalVideos,
  userName = "YouTube Learner"
) => {
  // Create a hidden canvas
  const canvas = document.createElement("canvas");
  canvas.width = 1920;
  canvas.height = 1357; // A4 landscape ratio
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#f0f0fa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative border
  ctx.strokeStyle = "#9c98ff";
  ctx.lineWidth = 10;
  ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

  ctx.lineWidth = 3;
  ctx.strokeRect(90, 90, canvas.width - 180, canvas.height - 180);

  // Certificate title
  ctx.fillStyle = "#3e3e3e";
  ctx.font = "bold 120px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Certificate of Completion", canvas.width / 2, 320);

  // Decorative line
  ctx.strokeStyle = "#9c98ff";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(480, 400);
  ctx.lineTo(canvas.width - 480, 400);
  ctx.stroke();

  // Main text
  ctx.fillStyle = "#666666";
  ctx.font = "48px Arial";
  ctx.fillText("This is to certify that", canvas.width / 2, 520);

  // Recipient name
  ctx.fillStyle = "#3e3e3e";
  ctx.font = "bold 80px Arial";
  ctx.fillText(userName, canvas.width / 2, 630);

  // Achievement text
  ctx.fillStyle = "#666666";
  ctx.font = "48px Arial";
  ctx.fillText("has successfully completed", canvas.width / 2, 730);

  // Playlist title (with text wrapping)
  ctx.fillStyle = "#9c98ff";
  ctx.font = "bold 64px Arial";
  const maxWidth = 1500;
  const words = playlistTitle.split(" ");
  let line = "";
  let y = 850;
  const lineHeight = 80;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, canvas.width / 2, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, canvas.width / 2, y);
  y += lineHeight + 20;

  // Channel and video count
  ctx.fillStyle = "#666666";
  ctx.font = "42px Arial";

  if (channelName) {
    ctx.fillText(`by ${channelName}`, canvas.width / 2, y);
    y += 60;
  }

  ctx.fillText(`${totalVideos} videos completed`, canvas.width / 2, y);

  // Date
  ctx.fillStyle = "#999999";
  ctx.font = "36px Arial";
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  ctx.fillText(`Issued on ${today}`, canvas.width / 2, canvas.height - 100);

  // Convert canvas to blob and download
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const sanitizedTitle = playlistTitle
      .replace(/[^a-z0-9]/gi, "_")
      .substring(0, 50);
    a.href = url;
    a.download = `Certificate_${sanitizedTitle}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, "image/png");
};
