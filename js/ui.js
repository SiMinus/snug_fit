export default class UI {
  constructor(options = {}) {
    this.score = 0;
    this.screenWidth = options.screenWidth || 0;
    this.screenHeight = options.screenHeight || 0;
    this.toastText = '';
    this.toastExpireAt = 0;
    this.buttons = {
      continue: null,
      restart: null
    };
  }

  setScreenSize(width, height) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  setScore(score) {
    this.score = score;
  }

  showToast(text, duration = 1600) {
    this.toastText = text;
    this.toastExpireAt = Date.now() + duration;
  }

  render(ctx, options = {}) {
    const {
      nextShape = null,
      blockSize = 24,
      gameOver = false,
      finalScore = this.score
    } = options;

    this.renderScore(ctx);
    this.renderNextPreview(ctx, nextShape, blockSize);

    if (gameOver) {
      this.showGameOver(ctx, finalScore);
    }

    this.renderToast(ctx);
  }

  renderScore(ctx) {
    ctx.save();
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`分数 ${this.score}`, 20, 20);
    ctx.restore();
  }

  renderNextPreview(ctx, nextShape, blockSize = 24) {
    const boxWidth = 108;
    const boxHeight = 112;
    const x = this.screenWidth - boxWidth - 16;
    const y = 16;
    const previewBlockSize = Math.floor(blockSize * 0.65);

    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 2;
    this.drawRoundRect(ctx, x, y, boxWidth, boxHeight, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#374151';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('下一个', x + boxWidth / 2, y + 10);

    if (nextShape) {
      const shapeWidth = nextShape.matrix[0].length * previewBlockSize;
      const shapeHeight = nextShape.matrix.length * previewBlockSize;
      const shapeX = x + (boxWidth - shapeWidth) / 2;
      const shapeY = y + 44 + (boxHeight - 52 - shapeHeight) / 2;

      nextShape.draw(ctx, shapeX, shapeY, previewBlockSize);
    }

    ctx.restore();
  }

  renderAdButton(ctx) {
    if (!this.buttons.continue) {
      return;
    }

    this.drawButton(ctx, this.buttons.continue, '#FACC15', '#713F12', '看广告继续');
  }

  renderToast(ctx) {
    if (!this.toastText || Date.now() > this.toastExpireAt) {
      return;
    }

    const width = 188;
    const height = 40;
    const x = (this.screenWidth - width) / 2;
    const y = this.screenHeight - 96;

    ctx.save();
    ctx.fillStyle = 'rgba(17, 24, 39, 0.82)';
    this.drawRoundRect(ctx, x, y, width, height, 10);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.toastText, x + width / 2, y + height / 2);
    ctx.restore();
  }

  handleTouch(x, y) {
    if (this.isPointInRect(x, y, this.buttons.continue)) {
      return 'continue';
    }

    if (this.isPointInRect(x, y, this.buttons.restart)) {
      return 'restart';
    }

    return null;
  }

  showGameOver(ctx, finalScore = this.score) {
    const panelWidth = Math.min(this.screenWidth - 48, 300);
    const panelHeight = 246;
    const panelX = (this.screenWidth - panelWidth) / 2;
    const panelY = (this.screenHeight - panelHeight) / 2;
    const buttonWidth = panelWidth - 48;
    const buttonHeight = 44;
    const buttonX = panelX + 24;

    this.buttons.continue = {
      x: buttonX,
      y: panelY + 122,
      width: buttonWidth,
      height: buttonHeight
    };
    this.buttons.restart = {
      x: buttonX,
      y: panelY + 178,
      width: buttonWidth,
      height: buttonHeight
    };

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, this.screenWidth, this.screenHeight);

    ctx.fillStyle = '#FFFFFF';
    this.drawRoundRect(ctx, panelX, panelY, panelWidth, panelHeight, 14);
    ctx.fill();

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 26px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('游戏结束', this.screenWidth / 2, panelY + 28);

    ctx.fillStyle = '#4B5563';
    ctx.font = '18px Arial';
    ctx.fillText(`最终分数 ${finalScore}`, this.screenWidth / 2, panelY + 72);

    this.renderAdButton(ctx);
    this.drawButton(ctx, this.buttons.restart, '#E5E7EB', '#374151', '重新开始');
    ctx.restore();
  }

  drawButton(ctx, rect, fillStyle, textStyle, text) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    this.drawRoundRect(ctx, rect.x, rect.y, rect.width, rect.height, 12);
    ctx.fill();
    ctx.fillStyle = textStyle;
    ctx.font = 'bold 17px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, rect.x + rect.width / 2, rect.y + rect.height / 2);
    ctx.restore();
  }

  drawRoundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  isPointInRect(x, y, rect) {
    return Boolean(
      rect
      && x >= rect.x
      && x <= rect.x + rect.width
      && y >= rect.y
      && y <= rect.y + rect.height
    );
  }

  reset() {
    this.score = 0;
    this.toastText = '';
    this.toastExpireAt = 0;
    this.buttons.continue = null;
    this.buttons.restart = null;
  }
}
