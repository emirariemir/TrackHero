// modules/utils.js

export const getActiveTab = async () => {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

/**
 * getUserName()
 * -------------
 * Retrieves the stored user name from chrome storage
 */
export const getUserName = async () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(["userName"], (result) => {
      resolve(result.userName || "Guest");
    });
  });
};

/**
 * setUserName(name)
 * -----------------
 * Saves the user name to chrome storage
 */
export const setUserName = async (name) => {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ userName: name }, () => {
      resolve();
    });
  });
};

/**
 * showSettingsModal(currentName, callback)
 * -----------------------------------------
 * Shows a modal dialog to update user's name in settings
 */
export const showSettingsModal = (currentName, callback) => {
  const modal = document.createElement("div");
  modal.className = "settings-modal";
  modal.innerHTML = `
    <div class="settings-modal-content">
      <h2>Update Your Name</h2>
      <p>Personalize your TrackHero experience</p>
      <input type="text" id="user-first-name" placeholder="First Name" class="name-input" />
      <input type="text" id="user-last-name" placeholder="Last Name" class="name-input" />
      <div class="modal-buttons">
        <button class="modal-cancel-btn">Cancel</button>
        <button class="modal-save-btn">Save</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const firstNameInput = modal.querySelector("#user-first-name");
  const lastNameInput = modal.querySelector("#user-last-name");
  const saveBtn = modal.querySelector(".modal-save-btn");
  const cancelBtn = modal.querySelector(".modal-cancel-btn");

  // Pre-fill current name
  if (currentName && currentName !== "Guest") {
    const nameParts = currentName.split(" ");
    firstNameInput.value = nameParts[0] || "";
    lastNameInput.value = nameParts.slice(1).join(" ") || "";
  }

  firstNameInput.focus();

  const closeModal = () => {
    modal.remove();
  };

  saveBtn.addEventListener("click", () => {
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
      if (e.key === "Enter") saveBtn.click();
    });
  });
};

/**
 * loadCustomFont()
 * ----------------
 * Loads the custom Coming Soon font before generating certificate
 */
const loadCustomFont = async () => {
  const comingSoon = new FontFace(
    "Coming Soon",
    "url(fonts/ComingSoon-Regular.ttf)"
  );
  const googleSans = new FontFace("Google Sans", "url(fonts/GoogleSans.ttf)");
  const googleSansSemiBold = new FontFace(
    "Google Sans SemiBold",
    "url(fonts/GoogleSans-SemiBold.ttf)"
  );

  try {
    const loadedComingSoon = await comingSoon.load();
    const loadedGoogleSans = await googleSans.load();
    const loadedGoogleSansSemibold = await googleSansSemiBold.load();

    document.fonts.add(loadedGoogleSans);
    document.fonts.add(loadedGoogleSansSemibold);
    document.fonts.add(loadedComingSoon);

    return true;
  } catch (error) {
    console.error("Failed to load custom font:", error);
    return false;
  }
};

/**
 * generateCertificate(playlistTitle, channelName, totalVideos, userName)
 * ----------------------------------------------------------------------
 * Generates and downloads a certificate using the custom template design
 */
export const generateCertificate = async (
  playlistTitle,
  channelName,
  totalVideos,
  userName = "YouTube Learner"
) => {
  await loadCustomFont();

  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d");

  // Load the certificate template
  const template = new Image();
  template.src = "assets/certificate-template.png";

  template.onload = () => {
    // Draw the template as the base
    ctx.drawImage(template, 0, 0, canvas.width, canvas.height);

    // Configure text rendering
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Subtitle text: "This mini-certificate is proudly presented to"
    ctx.fillStyle = "#1f2937";
    ctx.font = "32px Google Sans, sans-serif";
    ctx.fillText(
      "This mini-certificate is proudly presented to",
      canvas.width / 2,
      520
    );

    // User name with handwritten font
    ctx.fillStyle = "#000000";
    ctx.font = "90px 'Coming Soon', 'Comic Sans MS', cursive";
    ctx.fillText(userName, canvas.width / 2, 670);

    // Underline for name
    const nameWidth = ctx.measureText(userName).width;
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - nameWidth / 2 - 30, 710);
    ctx.lineTo(canvas.width / 2 + nameWidth / 2 + 30, 710);
    ctx.stroke();

    // "For completing X videos in"
    ctx.fillStyle = "#1f2937";
    ctx.font = "32px Google Sans, sans-serif";
    ctx.fillText(
      `For completing ${totalVideos} videos in`,
      canvas.width / 2,
      830
    );

    // Playlist title and channel (bold)
    ctx.fillStyle = "#000000";
    ctx.font = "bold 52px Google Sans SemiBold, sans-serif";

    // Combine playlist and channel
    const fullTitle = channelName
      ? `${playlistTitle} from ${channelName}`
      : playlistTitle;

    // Text wrapping for long titles
    const maxWidth = 1600;
    const words = fullTitle.split(" ");
    let line = "";
    let y = 940;
    const lineHeight = 65;
    const lines = [];

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        lines.push(line.trim());
        line = words[i] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());

    // Center multi-line text
    lines.forEach((textLine, index) => {
      ctx.fillText(textLine, canvas.width / 2, y + index * lineHeight);
    });

    // Convert canvas to blob and download
    setTimeout(() => {
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const sanitizedTitle = playlistTitle
          .replace(/[^a-z0-9]/gi, "_")
          .substring(0, 50);
        a.href = url;
        a.download = `Mini_Certificate_${sanitizedTitle}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, "image/png");
    }, 100);
  };

  // Handle template loading error
  template.onerror = () => {
    console.error("Failed to load certificate template");
    alert(
      "Error: Could not load certificate template. Please ensure 'certificate-template.png' exists."
    );
  };
};
