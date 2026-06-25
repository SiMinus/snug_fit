import Shape from './shape';
import Box from './box';
import Physics from './physics';
import UI from './ui';
import Ad from './ad';

const TOUCH_THRESHOLD = 20;
const CLICK_THRESHOLD = 10;
const AD_UNIT_ID = '';

export default class Main {
  constructor() {
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.systemInfo = wx.getSystemInfoSync();
    this.canvas.width = this.systemInfo.windowWidth;
    this.canvas.height = this.systemInfo.windowHeight;

    this.box = new Box();
    this.physics = new Physics({
      screenWidth: this.canvas.width,
      screenHeight: this.canvas.height
    });
    this.ui = new UI({
      screenWidth: this.canvas.width,
      screenHeight: this.canvas.height
    });
    this.ad = new Ad(AD_UNIT_ID);

    this.shape = null;
    this.nextShape = Shape.getRandomShape();
    this.score = 0;
    this.finalScore = 0;
    this.animationId = null;
    this.lastFrameTime = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.isShapeFalling = false;
    this.touchStart = null;
    this.lastStepState = null;

    this.spawnShape();
    this.bindTouchEvents();
  }

  start() {
    this.loop(0);
  }

  loop(timestamp) {
    const deltaFrames = this.getDeltaFrames(timestamp);

    this.update(deltaFrames);
    this.render();
    this.animationId = requestAnimationFrame((time) => this.loop(time));
  }

  getDeltaFrames(timestamp) {
    if (!this.lastFrameTime) {
      this.lastFrameTime = timestamp;
      return 1;
    }

    const deltaMs = timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;
    return Math.max(0.5, Math.min(deltaMs / 16.67, 2));
  }

  update(deltaFrames = 1) {
    if (this.isPaused || this.isGameOver || !this.isShapeFalling) {
      return;
    }

    const previousY = this.shape.y;
    this.physics.applyGravity(this.shape, deltaFrames);

    if (this.physics.checkCollision(this.shape)) {
      this.shape.y = previousY;
      this.lockCurrentShape();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.drawBox();
    this.drawStackedGrid();

    if (this.shape && this.isShapeFalling) {
      this.shape.draw(this.ctx, this.shape.x, this.shape.y, this.physics.blockSize);
    }

    this.ui.render(this.ctx, {
      nextShape: this.nextShape,
      blockSize: this.physics.blockSize,
      gameOver: this.isGameOver,
      finalScore: this.finalScore
    });
  }

  bindTouchEvents() {
    wx.onTouchStart((event) => {
      const touch = event.touches && event.touches[0];

      if (!touch) {
        return;
      }

      this.touchStart = {
        x: touch.clientX,
        y: touch.clientY
      };
    });

    wx.onTouchEnd((event) => {
      const touch = event.changedTouches && event.changedTouches[0];

      if (!touch || !this.touchStart) {
        return;
      }

      const x = touch.clientX;
      const y = touch.clientY;
      const deltaX = x - this.touchStart.x;
      const deltaY = y - this.touchStart.y;

      this.touchStart = null;

      if (this.isGameOver) {
        this.handleGameOverTouch(x, y);
        return;
      }

      this.handleShapeTouch(deltaX, deltaY);
    });
  }

  handleShapeTouch(deltaX, deltaY) {
    if (!this.isShapeFalling || !this.shape) {
      return;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX <= CLICK_THRESHOLD && absY <= CLICK_THRESHOLD) {
      this.hardDrop();
      return;
    }

    if (absX > absY && absX > TOUCH_THRESHOLD) {
      this.moveShape(deltaX > 0 ? 1 : -1);
      return;
    }

    if (absY > TOUCH_THRESHOLD) {
      this.rotateShape();
    }
  }

  handleGameOverTouch(x, y) {
    const action = this.ui.handleTouch(x, y);

    if (action === 'continue') {
      this.showContinueAd();
      return;
    }

    if (action === 'restart') {
      this.restart();
    }
  }

  moveShape(direction) {
    const nextX = this.shape.x + direction * this.physics.blockSize;

    if (this.physics.canPlace(this.shape, nextX, this.shape.y, this.shape.matrix)) {
      this.shape.x = nextX;
    }
  }

  rotateShape() {
    const previousMatrix = this.shape.matrix;

    this.shape.rotate();

    if (!this.physics.canPlace(this.shape, this.shape.x, this.shape.y, this.shape.matrix)) {
      this.shape.matrix = previousMatrix;
    }
  }

  hardDrop() {
    if (!this.isShapeFalling || !this.shape) {
      return;
    }

    this.physics.hardDrop(this.shape);
    this.lockCurrentShape();
  }

  lockCurrentShape() {
    if (!this.shape || !this.isShapeFalling) {
      return;
    }

    this.isShapeFalling = false;
    this.lastStepState = {
      stackedGrid: this.physics.cloneGrid(),
      score: this.score
    };

    this.physics.stackShape(this.shape);

    const clearedRows = this.physics.clearFullRows();
    this.score += 1 + clearedRows * 10;
    this.physics.setScore(this.score);
    this.ui.setScore(this.score);

    if (this.physics.checkOverflow()) {
      this.endGame();
      return;
    }

    this.spawnShape();
  }

  spawnShape() {
    this.shape = this.nextShape || Shape.getRandomShape();
    this.nextShape = Shape.getRandomShape();

    const startCol = Math.floor((this.physics.cols - this.shape.matrix[0].length) / 2);
    const startX = this.physics.boxX + startCol * this.physics.blockSize;
    const startY = this.physics.boxY - this.shape.matrix.length * this.physics.blockSize;

    this.shape.move(startX, startY);
    this.isShapeFalling = true;

    if (!this.physics.canPlace(this.shape, this.shape.x, this.shape.y, this.shape.matrix)) {
      this.endGame();
    }
  }

  showContinueAd() {
    this.ad.showAd(
      () => this.undoLastStep(),
      () => this.ui.showToast('广告暂时不可用')
    );
  }

  undoLastStep() {
    if (!this.lastStepState) {
      return;
    }

    this.physics.restoreGrid(this.lastStepState.stackedGrid);
    this.score = this.lastStepState.score;
    this.finalScore = this.score;
    this.physics.setScore(this.score);
    this.ui.setScore(this.score);
    this.isGameOver = false;
    this.spawnShape();
  }

  endGame() {
    this.isGameOver = true;
    this.isShapeFalling = false;
    this.finalScore = this.score;
  }

  drawBackground() {
    this.ctx.fillStyle = '#F8FAFC';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBox() {
    const box = this.physics.getBoxConfig();

    this.ctx.save();
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.strokeStyle = '#111827';
    this.ctx.lineWidth = 3;
    this.ctx.fillRect(box.x, box.y, box.width, box.height);
    this.ctx.strokeRect(box.x, box.y, box.width, box.height);

    this.ctx.strokeStyle = '#E5E7EB';
    this.ctx.lineWidth = 1;

    for (let col = 1; col < box.cols; col += 1) {
      const x = box.x + col * box.blockSize;
      this.ctx.beginPath();
      this.ctx.moveTo(x, box.y);
      this.ctx.lineTo(x, box.y + box.height);
      this.ctx.stroke();
    }

    for (let row = 1; row < box.rows; row += 1) {
      const y = box.y + row * box.blockSize;
      this.ctx.beginPath();
      this.ctx.moveTo(box.x, y);
      this.ctx.lineTo(box.x + box.width, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawStackedGrid() {
    const { stackedGrid, blockSize, boxX, boxY } = this.physics;

    this.ctx.save();
    this.ctx.strokeStyle = '#FFFFFF';
    this.ctx.lineWidth = 2;

    for (let row = 0; row < stackedGrid.length; row += 1) {
      for (let col = 0; col < stackedGrid[row].length; col += 1) {
        const cell = stackedGrid[row][col];

        if (!cell) {
          continue;
        }

        const x = boxX + col * blockSize;
        const y = boxY + row * blockSize;

        this.ctx.fillStyle = cell.color;
        this.ctx.fillRect(x, y, blockSize, blockSize);
        this.ctx.strokeRect(x, y, blockSize, blockSize);
      }
    }

    this.ctx.restore();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  restart() {
    this.score = 0;
    this.finalScore = 0;
    this.isGameOver = false;
    this.isPaused = false;
    this.lastStepState = null;
    this.physics.reset();
    this.ui.reset();
    this.nextShape = Shape.getRandomShape();
    this.spawnShape();
  }
}

