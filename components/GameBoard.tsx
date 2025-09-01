import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { GameState } from './GameLogic';

const { width: screenWidth } = Dimensions.get('window');
const BOARD_SIZE = Math.min(screenWidth - 20, 400);
const GRID_SIZE = 4;
const DOT_RADIUS = 4;
const LINE_WIDTH = 16; // زيادة عرض الخط لتسهيل الضغط

interface GameBoardProps {
  gameState: GameState;
  selectedLine?: { type: 'h' | 'v'; row: number; col: number } | null;
  onLinePress?: (type: 'h' | 'v', row: number, col: number) => void;
}

// تعريف نوع الخطوط لتفادي أخطاء any
interface LineInfo {
  id: string;
  row: number;
  col: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  selectedLine,
  onLinePress,
}) => {
  const dotSpacing = BOARD_SIZE / (GRID_SIZE + 1);

  // عداد للنقرات
  const [tapCount, setTapCount] = useState(0);

  // النقاط
  const dots = [];
  for (let row = 0; row <= GRID_SIZE; row++) {
    for (let col = 0; col <= GRID_SIZE; col++) {
      dots.push({
        id: `${row}-${col}`,
        row,
        col,
        x: col * dotSpacing + dotSpacing,
        y: row * dotSpacing + dotSpacing,
      });
    }
  }

  // الخطوط الأفقية
  const horizontalLines: LineInfo[] = [];
  for (let row = 0; row <= GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      horizontalLines.push({
        id: `h-${row}-${col}`,
        row,
        col,
        x1: col * dotSpacing + dotSpacing,
        y1: row * dotSpacing + dotSpacing,
        x2: (col + 1) * dotSpacing + dotSpacing,
        y2: row * dotSpacing + dotSpacing,
      });
    }
  }

  // الخطوط الرأسية
  const verticalLines: LineInfo[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col <= GRID_SIZE; col++) {
      verticalLines.push({
        id: `v-${row}-${col}`,
        row,
        col,
        x1: col * dotSpacing + dotSpacing,
        y1: row * dotSpacing + dotSpacing,
        x2: col * dotSpacing + dotSpacing,
        y2: (row + 1) * dotSpacing + dotSpacing,
      });
    }
  }

  // المربعات
  const boxes = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      boxes.push({
        id: `box-${row}-${col}`,
        row,
        col,
        x: col * dotSpacing + dotSpacing,
        y: row * dotSpacing + dotSpacing,
        size: dotSpacing,
      });
    }
  }

  return (
    <View style={styles.container}>
      <View style={{ position: 'relative' }}>
        <Svg width={BOARD_SIZE} height={BOARD_SIZE} style={styles.svg}>
          {/* رسم المربعات المكتملة */}
          {boxes.map((box) => {
            const isCompleted = gameState.boxes?.[box.row]?.[box.col];
            if (isCompleted) {
              // البحث عن اللاعب الذي أكمل المربع
              let playerColor = '#ddd';
              for (let i = 0; i < gameState.players.length; i++) {
                if (gameState.players[i].score > 0) {
                  playerColor = gameState.players[i].color;
                  break;
                }
              }
              return (
                <Rect
                  key={box.id}
                  x={box.x}
                  y={box.y}
                  width={box.size}
                  height={box.size}
                  fill={playerColor}
                  opacity={0.4}
                />
              );
            }
            return null;
          })}

          {/* رسم الخطوط الأفقية */}
          {horizontalLines.map((line) => {
            const isDrawn = gameState.horizontalLines[line.row][line.col];
            const isSelected =
              selectedLine &&
              selectedLine.type === 'h' &&
              selectedLine.row === line.row &&
              selectedLine.col === line.col;
            const y = line.y1 - LINE_WIDTH / 2;
            return (
              <React.Fragment key={line.id}>
                {/* مستطيل شفاف لالتقاط اللمس */}
                <Rect
                  x={line.x1}
                  y={y}
                  width={line.x2 - line.x1}
                  height={LINE_WIDTH * 2}
                  fill={'transparent'}
                  onPress={() => {
                    if (onLinePress) {
                      onLinePress('h', line.row, line.col);
                    }
                  }}
                />
                <Line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={
                    isSelected
                      ? '#1976d2'
                      : isDrawn
                      ? '#333'
                      : '#ddd'
                  }
                  strokeWidth={isSelected ? LINE_WIDTH + 4 : LINE_WIDTH}
                  strokeDasharray={isDrawn ? 'none' : '5,5'}
                />
              </React.Fragment>
            );
          })}

          {/* رسم الخطوط الرأسية */}
          {verticalLines.map((line) => {
            const isDrawn = gameState.verticalLines[line.row][line.col];
            const isSelected =
              selectedLine &&
              selectedLine.type === 'v' &&
              selectedLine.row === line.row &&
              selectedLine.col === line.col;
            const x = line.x1 - LINE_WIDTH / 2;
            return (
              <React.Fragment key={line.id}>
                {/* مستطيل شفاف لالتقاط اللمس */}
                <Rect
                  x={x}
                  y={line.y1}
                  width={LINE_WIDTH * 2}
                  height={line.y2 - line.y1}
                  fill={'transparent'}
                  onPress={() => {
                    if (onLinePress) {
                      onLinePress('v', line.row, line.col);
                    }
                  }}
                />
                <Line
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke={
                    isSelected
                      ? '#1976d2'
                      : isDrawn
                      ? '#333'
                      : '#ddd'
                  }
                  strokeWidth={isSelected ? LINE_WIDTH + 4 : LINE_WIDTH}
                  strokeDasharray={isDrawn ? 'none' : '5,5'}
                />
              </React.Fragment>
            );
          })}

          {/* رسم النقاط بدون تفاعل */}
          {dots.map((dot) => (
            <Circle
              key={dot.id}
              stroke={'#000000ff'}
              strokeWidth={2}
              fill={'#fff'}
              cx={dot.x}
              cy={dot.y}
              r={DOT_RADIUS}
              opacity={0.95}
            />
          ))}
        </Svg>
        {/* طبقة تفاعلية فوق اللوحة */}
        <View
          pointerEvents="auto"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: BOARD_SIZE,
            height: BOARD_SIZE,
          }}
          onStartShouldSetResponder={() => true}
          onResponderRelease={e => {
            setTapCount((prev) => prev + 1);
            const { locationX, locationY } = e.nativeEvent;
            // حساب أقرب خط
            let minDist = Infinity;
            // تعريف نوع selected ليكون واضحاً
            let selected: { type: 'h' | 'v'; row: number; col: number } | null = null;
            // تحقق من الخطوط الأفقية
            horizontalLines.forEach(line => {
              const cy = line.y1;
              const x1 = line.x1, x2 = line.x2;
              if (locationX >= x1 && locationX <= x2) {
                const dist = Math.abs(locationY - cy);
                if (dist < minDist && dist < 20) {
                  minDist = dist;
                  selected = { type: 'h', row: line.row, col: line.col };
                }
              }
            });
            // تحقق من الخطوط الرأسية
            verticalLines.forEach(line => {
              const cx = line.x1;
              const y1 = line.y1, y2 = line.y2;
              if (locationY >= y1 && locationY <= y2) {
                const dist = Math.abs(locationX - cx);
                if (dist < minDist && dist < 20) {
                  minDist = dist;
                  selected = { type: 'v', row: line.row, col: line.col };
                }
              }
            });
            // تأكيد نوع selected عند الاستدعاء
            if (selected && onLinePress) {
              const { type, row, col } = selected;
              onLinePress(type, row, col);
            }
          }}
        />
        {/* عرض العداد */}
        <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', padding: 6, borderRadius: 8, elevation: 2 }}>
          <Text style={{ fontWeight: 'bold', color: '#1976d2' }}>عدد النقرات: {tapCount}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  svg: {
    backgroundColor: 'transparent',
  },
});