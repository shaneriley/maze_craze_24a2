const gameOverLayer = {
  get el() {
    if (!this.__el) { this.__el = document.querySelector('.game_over'); }
    return this.__el;
  },
  showTime(endTime) {
    const seconds = `${~~(endTime / 1000) % 60}`.replace(/^(\d)$/, '0$1');
    let minutes = ~~(endTime / 60000) % 60;
    const hours = ~~(endTime / 3600000) % 24;
    if (hours) {
      minutes = `${minutes}`.replace(/^(\d)$/, '0$1');
    }
    const gameOverScreen = document.querySelector('.game_over');
    const duration = `${hours ? hours + ':' : ''}${minutes}:${seconds}`;

    this.el.querySelector('b').innerText = duration;
    this.el.classList.remove('hidden');
  },
  hide() {
    this.el.classList.add('hidden');
  },
};

class Maze {
  constructor() {
    this.width = 24;
    this.height = 24;
    this.cells = this._generate();
    this._render();
  }

  get seed() {
    return btoa(JSON.stringify(this.cells));
  }

  _generate() {
    const x = this.width;
    const y = this.height;
    const totalCells = x * y;
    const cells = [];
    const unvis = [];
    const path = [];

    for (let i = 0; i < y; i++) {
      cells[i] = new Array();
      unvis[i] = new Array();
      for (var j = 0; j < x; j++) {
        cells[i][j] = [0, 0, 0, 0];
        unvis[i][j] = true;
      }
    }

    // Set a random position to start from
    let currentCell = [Math.floor(Math.random()*y), Math.floor(Math.random()*x)];
    let visited = 1;

    path.push(currentCell);
    unvis[currentCell[0]][currentCell[1]] = false;

    // Loop through all available cell positions
    while (visited < totalCells) {
      // Determine neighboring cells
      const pot = [
        [currentCell[0] - 1, currentCell[1], 0, 2],
        [currentCell[0], currentCell[1] + 1, 1, 3],
        [currentCell[0] + 1, currentCell[1], 2, 0],
        [currentCell[0], currentCell[1] - 1, 3, 1]
      ];
      const neighbors = [];

      // Determine if each neighboring cell is in game grid, and whether it has already been checked
      for (let l = 0; l < 4; l++) {
        if (pot[l][0] > -1 && pot[l][0] < y && pot[l][1] > -1 && pot[l][1] < x && unvis[pot[l][0]][pot[l][1]]) {
          neighbors.push(pot[l]);
        }
      }

      // If at least one active neighboring cell has been found
      if (neighbors.length) {
        // Choose one of the neighbors at random
        const next = neighbors[Math.floor(Math.random()*neighbors.length)];

        // Remove the wall between the current cell and the chosen neighboring cell
        cells[currentCell[0]][currentCell[1]][next[2]] = 1;
        cells[next[0]][next[1]][next[3]] = 1;

        // Mark the neighbor as visited, and set it as the current cell
        unvis[next[0]][next[1]] = false;
        visited++;
        currentCell = [next[0], next[1]];
        path.push(currentCell);
      }
      // Otherwise go back up a step and keep going
      else {
        currentCell = path.pop();
      }
    }
    return cells;
  }

  _render() {
    const classesFor = (cell) => {
      return `${cell[0] ? '' : 't'} ${cell[1] ? '' : 'r'} ${cell[2] ? '' : 'b'} ${cell[3] ? '' : 'l'}`;
    };

    document.querySelector('table').innerHTML = this.cells.map((row) => {
      const cells = row.map((cell) => `<td class="${classesFor(cell)}"></td>`).join('');
      return `<tr>
        ${cells}
      </tr>`;
    }).join('');
  }
}

class MazeCraze {
  constructor() {
    this.defaultDotColor = 'rgba(0, 0, 0, 0)';
    this.endColor = '#b00b00';
    this.visitedDotColor = '#a0a0a0';
    this.width = 24;
    this.height = 24;
    this.maze = [];
    this.startTime = null;
    this.initVisitedCells();
    this.initPlayer();

    this.game = new Game({
      containerId: 'game_canvas',
      defaultDotColor: this.defaultDotColor,
      create: this.create.bind(this),
      update: this.update.bind(this),
      onKeyPress: this.onKeyPress.bind(this),
    });

    this.game.run();
  }

  initVisitedCells() {
    const self = this;
    const visited_cells = {
      cells: [],
      visit(x, y) {
        this.cells[y][x] = 1;
      },
      clearCells() {
        this.cells = [];
        const row = [];
        row.length = self.width;
        row.fill(0);
        for (let y = 0; y < self.height; y++) {
          this.cells.push([...row]);
        }
      },
    }

    this.visited_cells = visited_cells;
  }

  initPlayer() {
    const self = this;

    const player = {
      x: 0,
      y: 0,
      color: 'blue',
      movements: {
        [Direction.Up]() {
          if (!player.y) { return; }
          if (player.cell()[0]) { player.y--; }
        },
        [Direction.Right]() {
          if (player.x + 1 === self.maze.width) { return; }
          if (player.cell()[1]) { player.x++; }
        },
        [Direction.Down]() {
          if (player.y + 1 === self.maze.height) { return; }
          if (player.cell()[2]) { player.y++; }
        },
        [Direction.Left]() {
          if (!player.x) { return; }
          if (player.cell()[3]) { player.x--; }
        },
      },
      cell() {
        return self.maze.cells[player.y][player.x];
      },
      moveIn(direction) {
        this.movements[direction]();
      },
    }

    this.player = player;
  }

  create(game) {
    this.maze = new Maze();
    this.startTime = new Date();
    this.visited_cells.clearCells();
    this.visited_cells.visit(this.player.x, this.player.y);
    game.setText('Move: arrow keys');
  }

  update(game) {
    this.visited_cells.cells.map((row, y) => {
      row.map((cell, x) => {
        game.setDot(x, y, this[`${cell ? 'visited' : 'default'}DotColor`]);
      });
    });
    game.setDot(this.player.x, this.player.y, this.player.color);
    game.setDot(this.width - 1, this.height - 1, this.endColor);
    if (this.player.x + 1 === this.width && this.player.y + 1 === this.height) {
      this.gameOver();
    }
  }

  onKeyPress(direction) {
    this.player.moveIn(direction);
    this.visited_cells.visit(this.player.x, this.player.y);
  }

  gameOver() {
    gameOverLayer.showTime(+(new Date()) - +this.startTime);
    setTimeout(() => {
      maze_craze.game.end();
      document.querySelector('canvas').remove();
    }, 1000);
  }
}

let maze_craze;
document.addEventListener('DOMContentLoaded', () => {
  maze_craze = new MazeCraze();
  document.querySelector('button').addEventListener('click', () => {
    gameOverLayer.hide();
    maze_craze = new MazeCraze();
  });
});
