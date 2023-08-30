import { Client, Room } from "colyseus.js";
import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  client = new Client("ws://localhost:2567");
  room: Room;
  playerEntities: { [sessionId: string]: any } = {};

  inputPayload = {
    left: false,
    right: false,
    up: false,
    down: false,
  };

  cursorKeys: Phaser.Types.Input.Keyboard.CursorKeys;

  preload() {
    this.load.image(
      "ship_0001",
      "https://cdn.glitch.global/3e033dcd-d5be-4db4-99e8-086ae90969ec/ship_0001.png"
    );

    this.cursorKeys = this.input.keyboard.createCursorKeys();
  }

  async create() {
    try {
      this.room = await this.client.joinOrCreate("my_room");

      this.room.state.players.onAdd((player, sessionId) => {
        const entity = this.physics.add.image(player.x, player.y, "ship_0001");
        this.playerEntities[sessionId] = entity;

        player.onChange(() => {
          entity.setData("serverX", player.x);
          entity.setData("serverY", player.y);
        });
      });

      this.room.state.players.onRemove((player, sessionId) => {
        const entity = this.playerEntities[sessionId];
        if (entity) {
          entity.destroy();

          delete this.playerEntities[sessionId];
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  update(time: number, delta: number): void {
    // game loop
    if (!this.room) {
      return;
    }

    this.inputPayload.left = this.cursorKeys.left.isDown;
    this.inputPayload.right = this.cursorKeys.right.isDown;
    this.inputPayload.up = this.cursorKeys.up.isDown;
    this.inputPayload.down = this.cursorKeys.down.isDown;
    this.room.send(0, this.inputPayload);

    for (let sessionId in this.playerEntities) {
      const entity = this.playerEntities[sessionId];
      const { serverX, serverY } = entity.data.values;

      entity.x = Phaser.Math.Linear(entity.x, serverX, 0.2);
      entity.y = Phaser.Math.Linear(entity.y, serverY, 0.2);
    }
  }
}

// game config
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#b6d53c",
  parent: "phaser-example",
  physics: { default: "arcade" },
  pixelArt: true,
  scene: [GameScene],
};

// instantiate the game
const game = new Phaser.Game(config);
