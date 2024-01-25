const Engine = Matter.Engine;
const Runner = Matter.Runner;
const Bodies = Matter.Bodies;
const Events = Matter.Events;
const World = Matter.World;
const Constraint = Matter.Constraint; // Add this line to include Constraint

let engine;
let world;
let mouse;
let spacePressed = false;
let isDrag = false;
let bgX = 0;
let bgY = 0;
let active = -1;
let hangingBox; // Variable to store the hanging box
let stringConstraint;
let pendulum;
let blocks = [];
let murmel;
let bgMusic;

let canvasElem;
let off = { x: 0, y: 0 };

const dim = { w: 3840, h: 7200 };
let direction = 0.2;

let bouncingSound;
let backgroundImage;
let ballSVG;
let ballOverlay;
let bookImg;
let fallingBook = [];
let rabbitImg;
const numRabbits = 3;
const rabbits = [];
const rabbit = [];



let sounds = [
  './assets/audio/do.mp3',
  './assets/audio/re.mp3',
  './assets/audio/mi.mp3',
  './assets/audio/fa.mp3',
  './assets/audio/so.mp3',
  './assets/audio/la.mp3',
  './assets/audio/ti.mp3',
  './assets/audio/dom.mp3'
];

function preload() {
  console.log("Preloading audio files...");

  bouncingSound = new Audio('./assets/audio/rubber-ball-bouncing-98700.mp3');
  bgMusic = new Audio('./assets/audio/bgmusic.mp3');

  console.log("Loaded audio file:", bouncingSound.src);

  backgroundImage = loadImage('./assets/graphics/background/backdrop.jpg');
  backgroundImage.resize(600, 1000);
  ballOverlay = loadImage('./assets/graphics/foreground/ball.svg');
  ballSVG = loadImage('./assets/graphics/foreground/ball star.svg');
  fallingBookImg = loadImage('./assets/graphics/foreground/book.png');
  rabbitImg = loadImage('./assets/graphics/foreground/whiteRabbit.png');
}

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('thecanvas');
  canvasElem = document.getElementById('thecanvas');
  canvasElem.addEventListener('click', () => {
    bgMusic.play();
  });
imageMode(CENTER)
  canvasElem = document.getElementById('thecanvas');

  engine = Engine.create();
  world = engine.world; 

  new BlocksFromSVG(engine.world, './assets/graphics/foreground/static.svg', blocks, { isStatic: true, friction: 10 });

  createFallingBook(1750, 35, { force: { x: 0, y: 0.005 } }, false);
  createFallingBook(2500, 650, { force: { x: 0, y: 0.1 } }, false);

  createFallingBook(2250, 1376, { force: { x: 0, y: 0.005 } }, false);
  createFallingBook(1850, 1376, { force: { x: 0, y: 0.005 } }, false);
  createFallingBook(1500, 1376, { force: { x: 0, y: 0.005 } }, false);
  const rabbit1 = createRabbit(800, 500);
  const rabbit2 = createRabbit(1400, 500); // Adjust x-coordinate as needed
  const rabbit3 = createRabbit(2000, 500); // Adjust x-coordinate as needed

  // Add each rabbit to the rabbit array
  rabbit.push(rabbit1, rabbit2, rabbit3);

  blocks.push(new BlockCore(engine.world, { x: -dim.w / 2, y: dim.h / 2, w: dim.w, h: dim.h, color: 'black' }, { isStatic: true }));
  blocks.push(new BlockCore(engine.world, { x: dim.w + dim.w / 2, y: dim.h / 2, w: dim.w, h: dim.h, color: 'black' }, { isStatic: true }));

  blocks.push(new BlockCore(engine.world,
    {
      x: 0, y: 0, w: 100, h: 15000,
      trigger: () => {
        direction *= -1;
        console.log('Left Trigger');
      }
    },
    { isStatic: true }
  ));

  blocks.push(new BlockCore(engine.world,
    {
      x: dim.w - 5, y: 0, w: 100, h: 15000,
      trigger: () => {
        direction *= -1;
        console.log('Right Trigger');
      }
    },
    { isStatic: true }
  ));

  blocks.push(murmel);


  hangingBox = new Block(
    engine.world, {
      x: 750, // Adjust the x-coordinate based on your layout
      y: 100, // Adjust the y-coordinate based on your layout
      w: 100,
      h: 100,
      color: 'cyan'
    },
    { isStatic: false, density: 0.01 } // Adjust the density
  );

  // Constrain the hanging box to a fixed point (create a shorter string)
  hangingBox.constrainTo(null, { pointB: { x: 750, y: 50 }, length: 200, draw: true });

  // Add the hanging box to the blocks array
  blocks.push(hangingBox);


  // Constrain the hanging box to a fixed point (create a string)
  stringConstraint = Constraint.create({
    bodyA: hangingBox.body,
    pointA: { x: 0, y: -20 }, // Offset point for the string
    pointB: { x: 750, y: 50 }, // Fixed point for the string
    length: 0, // Initial length (will be adjusted later)
    stiffness: 0.1
  });

  // Add the hanging box and string to the blocks array
  blocks.push(hangingBox);
  blocks.push(stringConstraint);



  const soundSensor = createSoundSensor(engine.world, 104, 2437, 4500, 15, sounds, () => {
    console.log(' Sound sensor triggered by the ball!');
  });

  blocks.push(soundSensor);
  Events.on(engine, 'collisionStart', function (event) {
    var pairs = event.pairs;
    pairs.forEach((pair, i) => {
      if (pair.bodyA.label == 'Murmel') {
        pair.bodyA.plugin.block.collideWith(pair.bodyB.plugin.block)
      }
      if (pair.bodyB.label == 'Murmel') {
        pair.bodyB.plugin.block.collideWith(pair.bodyA.plugin.block)
      }
    })
  })


  
  Runner.run(engine);
}

function scrollEndless(point) {
  off = { x: Math.min(Math.max(0, point.x - windowWidth / 2), dim.w - windowWidth), y: Math.min(Math.max(0, point.y - windowHeight / 2), dim.h - windowHeight) };
  canvasElem.style.left = Math.round(off.x) + 'px';
  canvasElem.style.top = Math.round(off.y) + 'px';
  translate(-off.x, -off.y);
  window.scrollTo(off.x, off.y);
}

function keyPressed(event) {
  switch (keyCode) {
    case 32:
      event.preventDefault();

      if (active === -1) {
        active = 0;
        murmel = new Ball(world, { x: 300, y: 100, r: 75, image: ballSVG }, { label: "Murmel", density: 0.0015, restitution: 0.3, xfriction: 0, frictionAir: 0 });

        blocks.push(murmel);
        bouncingSound.play();
      } else {
        Matter.Body.applyForce(murmel.body, murmel.body.position, { x: direction * 2, y: 0 });
        bouncingSound.play();
       // rabbit.y = 890;
      }
      break;
    case 65:
      break;
    case 70:
      console.log("f");
      break;
    default:
      console.log(keyCode);
  }
}

function draw() {
  if (active < -1) {
  }

  clear();
  let bgWidth = width;
  let bgHeight = height;
  image(backgroundImage, 3840, 7200, bgWidth, bgHeight);
  scrollEndless(murmel ? murmel.body.position : { x: 0, y: 0 });
  //animateRabbit(); // Add this line to continuously update the rabbit's position

  if (spacePressed && murmel) {
    Matter.Body.applyForce(murmel.body, murmel.body.position, { x: direction, y: 0 });
    spacePressed = false;
  }

  if (murmel && murmel.draw) {
    image(ballOverlay, murmel.body.position.x, murmel.body.position.y) 

    murmel.draw();
  }

  blocks.forEach(block => {
    if (block && block.draw) {
      block.draw();
    }
  });

  fallingBook.forEach(block => {
    if (block && block.draw) {
      block.draw();
    }
  });
  
  rabbit.forEach(block => {
    if (block && block.draw) {
      block.draw();
    }
  });
  animateRabbit();
  hangingBox.draw();

  // Draw the string (constraint)
  stroke(255);
  strokeWeight(2);
  line(
    stringConstraint.bodyA.position.x + stringConstraint.pointA.x,
    stringConstraint.bodyA.position.y + stringConstraint.pointA.y,
    stringConstraint.pointB.x,
    stringConstraint.pointB.y
  );

  }


