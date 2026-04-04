<template>
  <div class="particle-background">
    <canvas id="particlesCanvas"></canvas>
  </div>
</template>

<script>
export default {
  name: 'ParticleBackground',
  mounted() {
    this.initParticles();
  },
  methods: {
    initParticles() {
      // 配置参数
      const config = {
        showFPS: false,
        fpsLimit: 60,
        transparentBackground: false,
        backgroundColor1: '#ffffff', // 白色
        backgroundColor2: '#ffffff', // 白色
        particleColor: '#660099', // 圆通紫
        lineColor: '#660099', // 圆通紫
        particleQuantity: 100,
        particleRadius: 3,
        lineWidth: 2,
        minVelocity: 0.5,
        maxVelocity: 2,
        disapearOffset: 150,
        minDistOpacity: 50,
        maxDistOpacity: 150
      };

      // 向量类
      class Vector2D {
        constructor(x, y) {
          this.x = x;
          this.y = y;
        }
        add(v) {
          return new Vector2D(this.x + v.x, this.y + v.y);
        }
        sub(v) {
          return new Vector2D(this.x - v.x, this.y - v.y);
        }
        mul(s) {
          return new Vector2D(this.x * s, this.y * s);
        }
        norm() {
          const len = Math.sqrt(this.x * this.x + this.y * this.y);
          return new Vector2D(this.x / len, this.y / len);
        }
        squaredDist(v) {
          const dx = this.x - v.x;
          const dy = this.y - v.y;
          return dx * dx + dy * dy;
        }
      }

      // 鼠标位置
      let mousePos = new Vector2D(innerWidth / 2, innerHeight / 2);
      
      // 粒子类
      class Particle {
        static particles = [];

        constructor() {
          this.radius = config.particleRadius;
          this.pos = new Vector2D(
            Math.floor(Math.random() * (innerWidth - this.radius * 2) + this.radius),
            Math.floor(Math.random() * (innerHeight - this.radius * 2) + this.radius)
          );
          this.vel = new Vector2D(Math.random() * 1, Math.random() * 1);
          this.vel.x = Math.floor(Math.random() * 2) === 0 ? this.vel.x * -1 : this.vel.x;
          this.vel.y = Math.floor(Math.random() * 2) === 0 ? this.vel.y * -1 : this.vel.y;
          this.vel = this.vel.norm().mul(Math.random() * (config.maxVelocity - config.minVelocity) + config.minVelocity);

          Particle.particles.push(this);
        }

        move() {
          // 鼠标交互：粒子靠近鼠标时产生斥力
          const mouseDist = this.pos.squaredDist(mousePos);
          const repelRadius = 150;
          if (mouseDist < repelRadius ** 2) {
            const direction = this.pos.sub(mousePos).norm();
            const force = (1 - mouseDist / (repelRadius ** 2)) * 0.5;
            const repelForce = direction.mul(force);
            this.vel = this.vel.add(repelForce);
          }

          // 限制速度
          const speed = Math.sqrt(this.vel.x * this.vel.x + this.vel.y * this.vel.y);
          if (speed > config.maxVelocity) {
            this.vel = this.vel.norm().mul(config.maxVelocity);
          }

          this.pos = this.pos.add(this.vel);
          if (this.pos.x - this.radius - config.disapearOffset >= innerWidth && this.vel.x > 0) {
            this.pos.x = 0 - this.radius - config.disapearOffset;
          } else if (this.pos.x + this.radius + config.disapearOffset <= 0 && this.vel.x < 0) {
            this.pos.x = innerWidth + this.radius + config.disapearOffset;
          }
          if (this.pos.y - this.radius - config.disapearOffset >= innerHeight && this.vel.y > 0) {
            this.pos.y = 0 - this.radius - config.disapearOffset;
          } else if (this.pos.y + this.radius + config.disapearOffset <= 0 && this.vel.y < 0) {
            this.pos.y = innerHeight + this.radius + config.disapearOffset;
          }
        }

        print(ctx) {
          if (config.lineWidth > 0) {
            this.connections(ctx);
          }
          if (config.particleRadius > 0) {
            ctx.beginPath();
            ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, true);
            ctx.fillStyle = config.particleColor;
            ctx.fill();
          }
          this.move();
        }

        connections(ctx) {
          for (let i = 0; i < Particle.particles.length; ++i) {
            if (Particle.particles[i] !== this) {
              let distance = this.pos.squaredDist(Particle.particles[i].pos);
              if (distance < config.maxDistOpacity ** 2) {
                ctx.beginPath();
                ctx.moveTo(this.pos.x, this.pos.y);
                ctx.lineTo(Particle.particles[i].pos.x, Particle.particles[i].pos.y);
                ctx.lineWidth = config.lineWidth;
                ctx.strokeStyle = `rgba(${parseInt(config.lineColor.slice(1, 3), 16)}, ${parseInt(config.lineColor.slice(3, 5), 16)}, ${parseInt(config.lineColor.slice(5, 7), 16)}, ${distance <= config.minDistOpacity ** 2 ? 1 : slope * Math.sqrt(distance) + height})`;
                ctx.stroke();
              }
            }
          }
        }
      }

      // 初始化
      const canvas = document.getElementById("particlesCanvas");
      const ctx = canvas.getContext("2d");

      const setCanvasSize = () => {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
      };
      setCanvasSize();
      window.addEventListener("resize", setCanvasSize);

      // 鼠标移动事件
      window.addEventListener("mousemove", (e) => {
        mousePos.x = e.clientX;
        mousePos.y = e.clientY;
      });

      // 设置背景
      if (config.transparentBackground) {
        canvas.style.backgroundColor = "rgba(0,0,0,0)";
      } else {
        canvas.style.backgroundImage = `radial-gradient(circle, ${config.backgroundColor1} 0%, ${config.backgroundColor2} 100%)`;
      }

      let slope;
      let height;
      const start = () => {
        slope = 1 / (config.minDistOpacity - config.maxDistOpacity);
        height = -slope * config.minDistOpacity + 1;

        Particle.particles = [];
        for (let i = 0; i < config.particleQuantity; ++i) {
          new Particle();
        }
        var last = performance.now() / 1000;
        var fpsThreshold = 0;
        const animate = () => {
          requestAnimationFrame(animate);

          var now = performance.now() / 1000;
          var dt = Math.min(now - last, 1);
          last = now;
          if (config.fpsLimit > 0) {
            fpsThreshold += dt;
            if (fpsThreshold < 1.0 / config.fpsLimit) {
              return;
            }
            fpsThreshold -= 1.0 / config.fpsLimit;
          }

          ctx.clearRect(0, 0, innerWidth, innerHeight);
          for (let i = 0; i < Particle.particles.length; ++i) {
            Particle.particles[i].print(ctx);
          }
        };
        animate();
      };
      start();
    }
  }
};
</script>

<style scoped>
.particle-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
}
</style>