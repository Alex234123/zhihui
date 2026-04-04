<template>
  <div class="space-background">
    <canvas ref="starCanvas" class="star-canvas"></canvas>
    <div class="nebula-layer"></div>
    <div class="cosmic-dust"></div>
    <div class="aurora-layer">
      <div class="aurora aurora-1"></div>
      <div class="aurora aurora-2"></div>
      <div class="aurora aurora-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const starCanvas = ref(null)
let ctx = null
let animationId = null
let stars = []
let shootingStars = []
const STAR_COUNT = 300
const SHOOTING_STAR_INTERVAL = 4000

class Star {
  constructor(canvasWidth, canvasHeight) {
    this.x = Math.random() * canvasWidth
    this.y = Math.random() * canvasHeight
    this.size = Math.random() * 2 + 0.5
    this.opacity = Math.random()
    this.twinkleSpeed = Math.random() * 0.02 + 0.005
    this.twinkleDirection = Math.random() > 0.5 ? 1 : -1
    this.color = this.getStarColor()
  }

  getStarColor() {
    const colors = ['#FFFFFF', '#FFE4B5', '#ADD8E6', '#E6E6FA', '#F0FFF0']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  update() {
    this.opacity += this.twinkleSpeed * this.twinkleDirection
    if (this.opacity >= 1) {
      this.opacity = 1
      this.twinkleDirection = -1
    } else if (this.opacity <= 0.2) {
      this.opacity = 0.2
      this.twinkleDirection = 1
    }
  }

  draw(ctx) {
    ctx.save()
    ctx.globalAlpha = this.opacity
    ctx.fillStyle = this.color
    ctx.shadowBlur = this.size * 3
    ctx.shadowColor = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

class ShootingStar {
  constructor(canvasWidth, canvasHeight) {
    this.x = Math.random() * canvasWidth
    this.y = Math.random() * canvasHeight * 0.3
    this.length = Math.random() * 100 + 50
    this.speed = Math.random() * 10 + 8
    this.angle = Math.PI / 4 + (Math.random() - 0.5) * 0.4
    this.opacity = 1
    this.trail = []
  }

  update() {
    const dx = Math.cos(this.angle) * this.speed
    const dy = Math.sin(this.angle) * this.speed
    
    this.trail.unshift({ x: this.x, y: this.y })
    if (this.trail.length > 20) this.trail.pop()
    
    this.x += dx
    this.y += dy
    this.opacity -= 0.01
    
    return this.opacity > 0 && this.x < starCanvas.value.width + 200 && this.y < starCanvas.value.height + 200
  }

  draw(ctx) {
    if (this.trail.length < 2) return
    
    ctx.save()
    for (let i = 0; i < this.trail.length - 1; i++) {
      const alpha = (1 - i / this.trail.length) * this.opacity
      const width = (1 - i / this.trail.length) * 2
      ctx.globalAlpha = alpha
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = width
      ctx.shadowBlur = 10
      ctx.shadowColor = '#FFFFFF'
      ctx.beginPath()
      ctx.moveTo(this.trail[i].x, this.trail[i].y)
      ctx.lineTo(this.trail[i + 1].x, this.trail[i + 1].y)
      ctx.stroke()
    }
    ctx.restore()
  }
}

const initStars = () => {
  stars = []
  const canvas = starCanvas.value
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(new Star(canvas.width, canvas.height))
  }
}

const animate = () => {
  const canvas = starCanvas.value
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 更新和绘制星星
  stars.forEach(star => {
    star.update()
    star.draw(ctx)
  })
  
  // 更新和绘制流星
  shootingStars = shootingStars.filter(star => star.update())
  shootingStars.forEach(star => star.draw(ctx))
  
  animationId = requestAnimationFrame(animate)
}

const createShootingStar = () => {
  const canvas = starCanvas.value
  shootingStars.push(new ShootingStar(canvas.width, canvas.height))
}

const handleResize = () => {
  const canvas = starCanvas.value
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  initStars()
}

onMounted(() => {
  const canvas = starCanvas.value
  ctx = canvas.getContext('2d')
  
  initStars()
  animate()
  
  // 定时创建流星
  setInterval(createShootingStar, SHOOTING_STAR_INTERVAL)
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationId) cancelAnimationFrame(animationId)
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.space-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  background: linear-gradient(135deg,
    #000033 0%,
    #001144 15%,
    #002266 30%,
    #003388 45%,
    #0044AA 60%,
    #003366 75%,
    #001133 90%,
    #000022 100%
  );
  overflow: hidden;
}

.star-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.nebula-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  z-index: 2;
  opacity: 0.12;
  background:
    radial-gradient(circle at 20% 20%, rgba(138, 43, 226, 0.25) 0%, transparent 40%),
    radial-gradient(circle at 80% 80%, rgba(65, 105, 225, 0.22) 0%, transparent 35%),
    radial-gradient(circle at 50% 50%, rgba(255, 99, 71, 0.08) 0%, transparent 55%),
    radial-gradient(circle at 70% 30%, rgba(147, 112, 219, 0.18) 0%, transparent 42%),
    radial-gradient(circle at 30% 70%, rgba(70, 130, 180, 0.16) 0%, transparent 48%),
    radial-gradient(circle at 85% 15%, rgba(255, 182, 193, 0.06) 0%, transparent 58%),
    radial-gradient(circle at 15% 85%, rgba(135, 206, 235, 0.14) 0%, transparent 52%);
  animation: nebulaDrift 120s ease-in-out infinite alternate;
}

@keyframes nebulaDrift {
  0% {
    transform: translate(-10%, -10%) rotate(0deg);
  }
  33% {
    transform: translate(5%, -5%) rotate(2deg);
  }
  66% {
    transform: translate(-5%, 5%) rotate(-1deg);
  }
  100% {
    transform: translate(10%, 10%) rotate(3deg);
  }
}

.cosmic-dust {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 3;
  opacity: 0.05;
  background-image:
    radial-gradient(1px 1px at 10% 20%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 30% 60%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 50% 10%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 70% 40%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 90% 80%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 15% 85%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 45% 95%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 75% 5%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 25% 35%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 65% 75%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 85% 25%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 5% 55%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 35% 15%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 55% 45%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 95% 65%, white 0%, transparent 100%),
    radial-gradient(1px 1px at 20% 90%, white 0%, transparent 100%);
  background-size: 250px 250px;
  animation: dustFloat 180s linear infinite;
}

@keyframes dustFloat {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-50px);
  }
  100% {
    transform: translateY(0);
  }
}

.aurora-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 4;
  overflow: hidden;
}

.aurora {
  position: absolute;
  width: 150%;
  height: 50%;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.07;
}

.aurora-1 {
  top: -20%;
  left: -25%;
  background: linear-gradient(
    to bottom right,
    rgba(0, 255, 127, 0.7),
    rgba(0, 255, 200, 0.4),
    rgba(64, 224, 208, 0.2),
    transparent
  );
  animation: auroraMove1 25s ease-in-out infinite alternate;
}

@keyframes auroraMove1 {
  0% {
    transform: translateX(0) translateY(0) rotate(0deg) scale(1);
  }
  33% {
    transform: translateX(15%) translateY(8%) rotate(3deg) scale(1.05);
  }
  66% {
    transform: translateX(-10%) translateY(-5%) rotate(-2deg) scale(0.98);
  }
  100% {
    transform: translateX(20%) translateY(12%) rotate(5deg) scale(1.08);
  }
}

.aurora-2 {
  top: -15%;
  left: 10%;
  background: linear-gradient(
    to bottom left,
    rgba(148, 0, 211, 0.6),
    rgba(186, 85, 211, 0.4),
    rgba(218, 112, 214, 0.2),
    transparent
  );
  animation: auroraMove2 32s ease-in-out infinite alternate;
}

@keyframes auroraMove2 {
  0% {
    transform: translateX(0) translateY(0) rotate(0deg) scale(1);
  }
  33% {
    transform: translateX(-18%) translateY(10%) rotate(-4deg) scale(1.04);
  }
  66% {
    transform: translateX(12%) translateY(-8%) rotate(3deg) scale(0.96);
  }
  100% {
    transform: translateX(-15%) translateY(15%) rotate(-5deg) scale(1.06);
  }
}

.aurora-3 {
  top: -25%;
  left: -5%;
  background: linear-gradient(
    to bottom,
    rgba(30, 144, 255, 0.6),
    rgba(72, 209, 204, 0.4),
    rgba(143, 188, 143, 0.2),
    transparent
  );
  animation: auroraMove3 28s ease-in-out infinite alternate;
}

@keyframes auroraMove3 {
  0% {
    transform: translateX(0) translateY(0) rotate(0deg) scale(1);
  }
  33% {
    transform: translateX(10%) translateY(-6%) rotate(2deg) scale(1.03);
  }
  66% {
    transform: translateX(-15%) translateY(9%) rotate(-3deg) scale(0.97);
  }
 100% {
    transform: translateX(18%) translateY(-10%) rotate(4deg) scale(1.05);
  }
}
</style>