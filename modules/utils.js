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
 * generateCertificate(playlistTitle, channelName, totalVideos, userName)
 * ----------------------------------------------------------------------
 * Generates and downloads a certificate matching the custom design
 */
export const generateCertificate = (
  playlistTitle,
  channelName,
  totalVideos,
  userName = "YouTube Learner"
) => {
  const canvas = document.createElement("canvas");
  // 2x resolution for better quality
  canvas.width = 2048;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d");

  // Load the certification logo
  const logo = new Image();
  logo.src = "certification-logo.png"; // Adjust path as needed

  logo.onload = () => {
    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Gradient border (purple to cyan)
    const borderWidth = 40;
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    gradient.addColorStop(0, "#a855f7"); // Purple
    gradient.addColorStop(1, "#06b6d4"); // Cyan

    ctx.strokeStyle = gradient;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(
      borderWidth / 2,
      borderWidth / 2,
      canvas.width - borderWidth,
      canvas.height - borderWidth
    );

    // Inner blue border
    const innerBorderOffset = 80;
    ctx.strokeStyle = "#6366f1"; // Blue/Indigo
    ctx.lineWidth = 3;
    ctx.strokeRect(
      innerBorderOffset,
      innerBorderOffset,
      canvas.width - innerBorderOffset * 2,
      canvas.height - innerBorderOffset * 2
    );

    // Corner grid decorations
    const drawCornerGrid = (x, y, flipX = 1, flipY = 1) => {
      ctx.save();
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3;

      const gridSize = 60;
      const cellSize = 30;

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + flipY * gridSize);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + flipX * gridSize, y);
      ctx.stroke();

      // Grid cell
      ctx.strokeRect(
        flipX > 0 ? x : x - cellSize,
        flipY > 0 ? y : y - cellSize,
        cellSize,
        cellSize
      );

      ctx.restore();
    };

    // Draw corner grids
    drawCornerGrid(120, 120, 1, 1); // Top-left
    drawCornerGrid(canvas.width - 120, 120, -1, 1); // Top-right
    drawCornerGrid(canvas.width - 120, canvas.height - 120, -1, -1); // Bottom-right
    drawCornerGrid(120, canvas.height - 120, 1, -1); // Bottom-left

    // "Mini-" text (Arial Rounded)
    ctx.fillStyle = "#000000";
    ctx.font =
      "48px 'Arial Rounded MT Bold', 'Arial Rounded', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Mini-", canvas.width / 2, 280);

    // "Certificate of Completion" text (Arial Rounded Bold)
    ctx.font =
      "bold 110px 'Arial Rounded MT Bold', 'Arial Rounded', Arial, sans-serif";
    ctx.fillText("Certificate of Completion", canvas.width / 2, 390);

    // Subtitle text
    ctx.fillStyle = "#1f2937";
    ctx.font = "32px Arial, sans-serif";
    ctx.fillText(
      "This mini-certificate is proudly presented to",
      canvas.width / 2,
      520
    );

    // User name with handwritten font (Coming Soon)
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
    ctx.font = "32px Arial, sans-serif";
    ctx.fillText(
      `For completing ${totalVideos} videos in`,
      canvas.width / 2,
      830
    );

    // Playlist title and channel (bold)
    ctx.fillStyle = "#000000";
    ctx.font = "bold 52px Arial, sans-serif";

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

    // Draw certification logo at bottom center
    const logoSize = 120;
    const logoX = canvas.width / 2 - logoSize / 2;
    const logoY = canvas.height - 200;

    ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

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

  // Handle logo loading error
  logo.onerror = () => {
    console.error("Failed to load certification logo");
    // Still generate certificate without logo
    logo.onload();
  };
};
