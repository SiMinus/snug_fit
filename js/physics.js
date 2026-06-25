export default class Physics {
  constructor(options = {}) {
    this.cols = options.cols || 10;
    this.rows = options.rows || 16;
    this.blockSize = options.blockSize || 24;
    this.baseSpeed = options.baseSpeed || 2;
    this.speedStep = options.speedStep || 0.15;
    this.maxSpeed = options.maxSpeed || 10;
    this.score = 0;

    const systemInfo = typeof wx !== 'undefined' && wx.getSystemInfoSync
      ? wx.getSystemInfoSync()
      : { windowWidth: 0, windowHeight: 0 };

    this.screenWidth = options.screenWidth || systemInfo.windowWidth;
    this.screenHeight = options.screenHeight || systemInfo.windowHeight;
    this.boxWidth = this.cols * this.blockSize;
    this.boxHeight = this.rows * this.blockSize;
    this.boxX = options.boxX !== undefined
      ? options.boxX
      : Math.floor((this.screenWidth - this.boxWidth) / 2);
    this.boxY = options.boxY !== undefined
      ? options.boxY
      : Math.floor((this.screenHeight - this.boxHeight) / 2);
    this.overflowEarlyOffset = 4;
    this.stackedGrid = this.createEmptyGrid();
    this.hasOverflowCells = false;
  }

  createEmptyGrid() {
    return Array.from({ length: this.rows }, () => (
      Array.from({ length: this.cols }, () => null)
    ));
  }

  setScore(score) {
    this.score = score;
  }

  getSpeed() {
    return Math.min(
      this.baseSpeed + this.score * this.speedStep,
      this.maxSpeed
    );
  }

  applyGravity(shape, deltaTime = 1) {
    shape.y += this.getSpeed() * deltaTime;
  }

  update(shape, deltaTime = 1) {
    this.applyGravity(shape, deltaTime);

    if (this.checkCollision(shape)) {
      shape.y -= this.getSpeed() * deltaTime;
      this.snapToGrid(shape);
      this.stackShape(shape);
      return true;
    }

    return false;
  }

  checkCollision(shape) {
    return this.checkBottomCollision(shape) || this.checkStackCollision(shape);
  }

  checkBottomCollision(shape) {
    const cells = shape.getCells();

    return cells.some(({ row }) => {
      const cellBottom = shape.y + (row + 1) * this.blockSize;
      return cellBottom >= this.boxY + this.boxHeight;
    });
  }

  checkStackCollision(shape) {
    const cells = shape.getCells();

    return cells.some(({ row, col }) => {
      const gridCol = this.pixelToGridCol(shape.x + col * this.blockSize);
      const gridRow = this.pixelToGridRow(shape.y + (row + 1) * this.blockSize);

      if (gridCol < 0 || gridCol >= this.cols || gridRow < 0) {
        return false;
      }

      if (gridRow >= this.rows) {
        return true;
      }

      return Boolean(this.stackedGrid[gridRow][gridCol]);
    });
  }

  stackShape(shape) {
    const cells = shape.getCells();

    cells.forEach(({ row, col }) => {
      const gridCol = this.pixelToGridCol(shape.x + col * this.blockSize);
      const gridRow = this.pixelToGridRow(shape.y + row * this.blockSize);
      const cellTop = shape.y + row * this.blockSize;

      // Design requirement: overflow intentionally triggers 4px before the cell visually crosses the box top.
      if (cellTop < this.boxY + this.overflowEarlyOffset) {
        this.hasOverflowCells = true;
      }

      if (
        gridRow >= 0
        && gridRow < this.rows
        && gridCol >= 0
        && gridCol < this.cols
      ) {
        this.stackedGrid[gridRow][gridCol] = {
          color: shape.color,
          type: shape.type
        };
      }
    });
  }

  checkOverflow() {
    if (this.hasOverflowCells) {
      return true;
    }

    return this.stackedGrid.some((row, rowIndex) => (
      row.some((cell) => {
        if (!cell) {
          return false;
        }

        const cellTop = this.boxY + rowIndex * this.blockSize;
        // Design requirement: overflow intentionally triggers 4px before visual overflow.
        return cellTop < this.boxY + this.overflowEarlyOffset;
      })
    ));
  }

  snapToGrid(shape) {
    const gridX = Math.round((shape.x - this.boxX) / this.blockSize);
    const gridY = Math.round((shape.y - this.boxY) / this.blockSize);

    shape.x = this.boxX + gridX * this.blockSize;
    shape.y = this.boxY + gridY * this.blockSize;
  }

  pixelToGridCol(pixelX) {
    return Math.floor((pixelX - this.boxX) / this.blockSize);
  }

  pixelToGridRow(pixelY) {
    return Math.floor((pixelY - this.boxY) / this.blockSize);
  }

  resolveStacking(shape) {
    if (!this.checkCollision(shape)) {
      return false;
    }

    this.snapToGrid(shape);
    this.stackShape(shape);
    return true;
  }

  isSettled(shape) {
    return this.checkCollision(shape);
  }

  getBoxConfig() {
    return {
      x: this.boxX,
      y: this.boxY,
      cols: this.cols,
      rows: this.rows,
      width: this.boxWidth,
      height: this.boxHeight,
      blockSize: this.blockSize
    };
  }

  reset() {
    this.score = 0;
    this.hasOverflowCells = false;
    this.stackedGrid = this.createEmptyGrid();
  }
}

