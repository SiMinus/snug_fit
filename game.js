import Main from './js/main';

class Game {
  constructor() {
    this.main = new Main();
  }

  start() {
    this.main.start();
  }
}

const game = new Game();
game.start();

