import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { AlgorithmStep } from '../../types';
import styles from './Canvas.module.css';

interface CanvasProps {
  heights: number[];
  currentStep: AlgorithmStep | null;
}

interface Transform {
  x: number;
  y: number;
  scale: number;
}

export function Canvas({ heights, currentStep }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });

  // 监听容器大小变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // 绑定拖拽和缩放
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          scale: event.transform.k,
        });
      });

    d3.select(svg).call(zoom);

    return () => {
      d3.select(svg).on('.zoom', null);
    };
  }, []);

  // 重置视图
  const resetView = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    
    d3.select(svg)
      .transition()
      .duration(300)
      .call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      );
    setTransform({ x: 0, y: 0, scale: 1 });
  }, []);

  // 计算布局参数
  const margin = { top: 60, right: 40, bottom: 120, left: 40 };
  const chartWidth = dimensions.width - margin.left - margin.right;
  const chartHeight = dimensions.height - margin.top - margin.bottom;
  
  const maxHeight = Math.max(...heights, 1);
  const barWidth = Math.min(60, (chartWidth - (heights.length - 1) * 4) / heights.length);
  const totalBarsWidth = heights.length * barWidth + (heights.length - 1) * 4;
  const startX = (chartWidth - totalBarsWidth) / 2;
  
  const yScale = d3.scaleLinear()
    .domain([0, maxHeight])
    .range([chartHeight, 0]);

  // 获取柱子颜色
  const getBarColor = (index: number): string => {
    if (!currentStep) return '#1890ff';
    
    if (currentStep.highlightRect) {
      const { left, right } = currentStep.highlightRect;
      if (index >= left && index <= right) {
        return '#52c41a';
      }
    }
    
    if (currentStep.highlightBars.includes(index)) {
      return '#faad14';
    }
    
    // 栈中的元素
    if (currentStep.stack.some(s => s.index === index)) {
      return '#1890ff';
    }
    
    return '#91caff';
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <div className={styles.toolbar}>
        <button className={styles.resetBtn} onClick={resetView}>
          重置视图
        </button>
        <span className={styles.hint}>拖拽平移 · 滚轮缩放</span>
      </div>
      
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.svg}
      >
        <g transform={`translate(${transform.x + margin.left}, ${transform.y + margin.top}) scale(${transform.scale})`}>
          {/* 柱状图 */}
          {heights.map((height, index) => {
            const x = startX + index * (barWidth + 4);
            const y = yScale(height);
            const barHeight = chartHeight - y;
            const color = getBarColor(index);
            
            return (
              <g key={index}>
                {/* 柱子 */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1}
                  rx={2}
                />
                
                {/* 高度标签 */}
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#333"
                >
                  {height}
                </text>
                
                {/* 索引标签 */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#666"
                >
                  {index}
                </text>
                
                {/* 左边界标签 */}
                {currentStep && currentStep.leftBoundary[index] !== undefined && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 36}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#faad14"
                  >
                    L:{currentStep.leftBoundary[index]}
                  </text>
                )}
                
                {/* 右边界标签 */}
                {currentStep && currentStep.rightBoundary[index] !== undefined && currentStep.rightBoundary[index] !== heights.length && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 50}
                    textAnchor="middle"
                    fontSize={10}
                    fill="#52c41a"
                  >
                    R:{currentStep.rightBoundary[index]}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* 高亮矩形区域 */}
          {currentStep?.highlightRect && (
            <rect
              x={startX + currentStep.highlightRect.left * (barWidth + 4)}
              y={yScale(currentStep.highlightRect.height)}
              width={(currentStep.highlightRect.right - currentStep.highlightRect.left + 1) * (barWidth + 4) - 4}
              height={chartHeight - yScale(currentStep.highlightRect.height)}
              fill="rgba(82, 196, 26, 0.2)"
              stroke="#52c41a"
              strokeWidth={2}
              strokeDasharray="4,2"
            />
          )}
          
          {/* 当前指针 */}
          {currentStep && currentStep.currentIndex >= 0 && currentStep.currentIndex < heights.length && (
            <g>
              <polygon
                points={`${startX + currentStep.currentIndex * (barWidth + 4) + barWidth / 2 - 8},${chartHeight + 65} ${startX + currentStep.currentIndex * (barWidth + 4) + barWidth / 2 + 8},${chartHeight + 65} ${startX + currentStep.currentIndex * (barWidth + 4) + barWidth / 2},${chartHeight + 55}`}
                fill="#ff4d4f"
              />
              <text
                x={startX + currentStep.currentIndex * (barWidth + 4) + barWidth / 2}
                y={chartHeight + 80}
                textAnchor="middle"
                fontSize={11}
                fill="#ff4d4f"
                fontWeight="bold"
              >
                i
              </text>
            </g>
          )}
        </g>
      </svg>
      
      {/* 单调栈可视化 */}
      {currentStep && currentStep.stack.length > 0 && (
        <div className={styles.stackPanel}>
          <div className={styles.stackTitle}>单调栈</div>
          <div className={styles.stackContent}>
            {currentStep.stack.map((item, idx) => (
              <div key={idx} className={styles.stackItem}>
                <span className={styles.stackIndex}>{item.index}</span>
                <span className={styles.stackHeight}>h:{item.height}</span>
              </div>
            ))}
          </div>
          <div className={styles.stackBottom}>栈底</div>
        </div>
      )}
      
      {/* 当前面积显示 */}
      {currentStep?.currentArea !== undefined && (
        <div className={styles.areaDisplay}>
          当前面积: <span className={styles.areaValue}>{currentStep.currentArea}</span>
          {currentStep.maxArea > 0 && (
            <>
              {' '}| 最大面积: <span className={styles.maxAreaValue}>{currentStep.maxArea}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
