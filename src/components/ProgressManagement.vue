import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  CopyDocument,
  Edit,
  Download,
  Search,
  TrendCharts,
  Upload,
  Delete,
  Plus,
  Check,
  User,
  DataLine,
  Calendar,
  Timer
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import dataService from '../services/dataService'