const SHAPE_DEFINITIONS = {
  square: [
    [1, 1],
    [1, 1]
  ],
  rectangle: [
    [1, 1, 1, 1],
    [1, 1, 1, 1]
  ],
  l: [
    [1, 0],
    [1, 0],
    [1, 1]
  ],
  t: [
    [1, 1, 1],
    [0, 1, 0]
  ],
  z: [
    [1, 1, 0],
    [0, 1, 1]
  ]
};

const SHAPE_TYPES = Object.keys(SHAPE_DEFINITIONS);

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#5D5FEF',
  '#F97316',
  '#22C55E'
];

export default class Shape {
  constructor(type = 'square') {
    this.type = type;
    this.matrix = Shape.cloneMatrix(SHAPE_DEFINITIONS[type]);
    this.color = Shape.getRandomColor();
    this.x = 0;
    this.y = 0;
  }

  static cloneMatrix(matrix) {
    return matrix.map((row) => row.slice());
  }

  static getRandomColor() {
    const index = Math.floor(Math.random() * COLORS.length);
    return COLORS[index];
  }

  static getRandomShape() {
    const index = Math.floor(Math.random() * SHAPE_TYPES.length);
    return new Shape(SHAPE_TYPES[index]);
  }

  generate(type = this.type) {
    this.type = type;
    this.matrix = Shape.cloneMatrix(SHAPE_DEFINITIONS[type]);
    this.color = Shape.getRandomColor();
  }

  rotate() {
    const rows = this.matrix.length;
    const cols = this.matrix[0].length;
    const rotated = [];

    for (let col = 0; col < cols; col += 1) {
      const nextRow = [];

      for (let row = rows - 1; row >= 0; row -= 1) {
        nextRow.push(this.matrix[row][col]);
      }

      rotated.push(nextRow);
    }

    this.matrix = rotated;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }

  draw(ctx, x = this.x, y = this.y, blockSize = 24) {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    for (let row = 0; row < this.matrix.length; row += 1) {
      for (let col = 0; col < this.matrix[row].length; col += 1) {
        if (!this.matrix[row][col]) {
          continue;
        }

        const blockX = x + col * blockSize;
        const blockY = y + row * blockSize;

        ctx.fillRect(blockX, blockY, blockSize, blockSize);
        ctx.strokeRect(blockX, blockY, blockSize, blockSize);
      }
    }

    ctx.restore();
  }

  render(ctx, x = this.x, y = this.y, blockSize = 24) {
    this.draw(ctx, x, y, blockSize);
  }

  getBounds(blockSize = 24) {
    return {
      x: this.x,
      y: this.y,
      width: this.matrix[0].length * blockSize,
      height: this.matrix.length * blockSize
    };
  }

  getCells() {
    const cells = [];

    for (let row = 0; row < this.matrix.length; row += 1) {
      for (let col = 0; col < this.matrix[row].length; col += 1) {
        if (this.matrix[row][col]) {
          cells.push({ row, col });
        }
      }
    }

    return cells;
  }

  reset() {
    this.generate(this.type);
    this.x = 0;
    this.y = 0;
  }
}

