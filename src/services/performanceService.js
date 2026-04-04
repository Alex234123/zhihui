// 性能监控服务

class PerformanceService {
  constructor() {
    this.metrics = {
      navigation: null,
      paint: null,
      resources: [],
      apiRequests: [],
      memory: null,
      cpu: null,
    };
    this.init();
  }

  init() {
    this.monitorNavigation();
    this.monitorPaint();
    this.monitorResources();
    this.monitorMemory();
    this.monitorAPI();
  }

  monitorNavigation() {
    if (performance && performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        this.metrics.navigation = navigationEntries[0];
      }
    }
  }

  monitorPaint() {
    if (performance && performance.getEntriesByType) {
      const paintEntries = performance.getEntriesByType('paint');
      if (paintEntries.length > 0) {
        this.metrics.paint = paintEntries;
      }
    }
  }

  monitorResources() {
    if (performance && performance.getEntriesByType) {
      const resourceEntries = performance.getEntriesByType('resource');
      this.metrics.resources = resourceEntries;
    }
  }

  monitorMemory() {
    if (performance && performance.memory) {
      this.metrics.memory = performance.memory;
    }
  }

  monitorAPI() {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        this.metrics.apiRequests.push({
          url: args[0],
          method: args[1]?.method || 'GET',
          duration: endTime - startTime,
          status: response.status,
          timestamp: new Date().toISOString(),
        });
        return response;
      } catch (error) {
        const endTime = performance.now();
        this.metrics.apiRequests.push({
          url: args[0],
          method: args[1]?.method || 'GET',
          duration: endTime - startTime,
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        });
        throw error;
      }
    };

    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (...args) {
      this._url = args[1];
      this._method = args[0];
      this._startTime = performance.now();
      this.addEventListener('load', () => {
        const endTime = performance.now();
        performanceService.metrics.apiRequests.push({
          url: this._url,
          method: this._method,
          duration: endTime - this._startTime,
          status: this.status,
          timestamp: new Date().toISOString(),
        });
      });
      this.addEventListener('error', () => {
        const endTime = performance.now();
        performanceService.metrics.apiRequests.push({
          url: this._url,
          method: this._method,
          duration: endTime - this._startTime,
          status: 'error',
          error: 'Network error',
          timestamp: new Date().toISOString(),
        });
      });
      originalXhrOpen.apply(this, args);
    };
  }

  getMetrics() {
    return this.metrics;
  }

  clearMetrics() {
    this.metrics = {
      navigation: null,
      paint: null,
      resources: [],
      apiRequests: [],
      memory: null,
      cpu: null,
    };
    this.init();
  }

  exportReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      userAgent: navigator.userAgent,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
    };
    return JSON.stringify(report, null, 2);
  }

  analyzeBottlenecks() {
    const bottlenecks = [];

    if (this.metrics.navigation) {
      const { domContentLoadedEventEnd, fetchStart } = this.metrics.navigation;
      const domLoadTime = domContentLoadedEventEnd - fetchStart;
      if (domLoadTime > 1000) {
        bottlenecks.push({
          type: 'navigation',
          metric: 'DOM加载时间',
          value: `${domLoadTime.toFixed(2)}ms`,
          severity: domLoadTime > 3000 ? 'high' : 'medium',
          recommendation: '优化DOM结构，减少阻塞资源',
        });
      }
    }

    if (this.metrics.paint) {
      const firstContentfulPaint = this.metrics.paint.find(entry => entry.name === 'first-contentful-paint');
      
      if (firstContentfulPaint) {
        const fcpTime = firstContentfulPaint.startTime;
        if (fcpTime > 2000) {
          bottlenecks.push({
            type: 'paint',
            metric: '首次内容绘制(FCP)',
            value: `${fcpTime.toFixed(2)}ms`,
            severity: fcpTime > 3000 ? 'high' : 'medium',
            recommendation: '优化首屏内容，减少关键资源大小',
          });
        }
      }
    }

    if (this.metrics.resources.length > 0) {
      const slowResources = this.metrics.resources.filter(resource => resource.duration > 1000);
      if (slowResources.length > 0) {
        bottlenecks.push({
          type: 'resources',
          metric: '慢资源',
          value: `${slowResources.length}个资源加载时间超过1s`,
          severity: slowResources.length > 5 ? 'high' : 'medium',
          recommendation: '优化资源大小，使用CDN，启用缓存',
        });
      }
    }

    if (this.metrics.apiRequests.length > 0) {
      const slowRequests = this.metrics.apiRequests.filter(request => request.duration > 500);
      if (slowRequests.length > 0) {
        bottlenecks.push({
          type: 'api',
          metric: '慢API请求',
          value: `${slowRequests.length}个请求响应时间超过500ms`,
          severity: slowRequests.length > 3 ? 'high' : 'medium',
          recommendation: '优化API响应时间，使用缓存，减少请求次数',
        });
      }
    }

    if (this.metrics.memory) {
      const { usedJSHeapSize, totalJSHeapSize } = this.metrics.memory;
      const memoryUsage = (usedJSHeapSize / totalJSHeapSize) * 100;
      if (memoryUsage > 80) {
        bottlenecks.push({
          type: 'memory',
          metric: '内存使用率',
          value: `${memoryUsage.toFixed(2)}%`,
          severity: memoryUsage > 90 ? 'high' : 'medium',
          recommendation: '优化内存使用，避免内存泄漏',
        });
      }
    }

    return bottlenecks;
  }
}

const performanceService = new PerformanceService();
export default performanceService;
