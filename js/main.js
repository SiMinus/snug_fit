import Shape from './shape';
import Box from './box';
import Physics from './physics';
import UI from './ui';
import Ad from './ad';

export default class Main {
  constructor() {
    this.canvas = wx.createCanvas();
    this.ctx = this.canvas.getContext('2d');
    this.shape = new Shape();
    this.box = new Box();
    this.physics = new Physics();
    this.ui = new UI();
    this.ad = new Ad();
    this.animationId = null;
  }

  start() {
    this.loop();
  }

  loop() {
    this.update();
    this.render();
    this.animationId = requestAnimationFrame(() => this.loop());
  }

  update() {
  }

  render() {
  }

  pause() {
  }

  resume() {
  }

  restart() {
  }
}

