import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HORIZONTAL_PADDING = 16;
const BUTTON_GAP = 12;
const AVAILABLE_WIDTH = Math.min(SCREEN_WIDTH, 420) - HORIZONTAL_PADDING * 2;
const BUTTON_SIZE = Math.floor((AVAILABLE_WIDTH - BUTTON_GAP * 3) / 4);

type Operator = '÷' | '×' | '−' | '+';

function formatDisplay(raw: string): string {
  if (raw === 'Error') return 'Error';
  const parts = raw.split(',');
  const intPart = parts[0].replace(/-/g, '');
  const isNeg = raw.startsWith('-');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decPart = parts.length > 1 ? ',' + parts[1] : '';
  return (isNeg ? '-' : '') + (formattedInt || '0') + decPart;
}

export default function CalculatorScreen() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [currentOp, setCurrentOp] = useState<Operator | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [lastOperand, setLastOperand] = useState<number | null>(null);
  const [lastOp, setLastOp] = useState<Operator | null>(null);

  const getNumericValue = (val: string): number => {
    return parseFloat(val.replace(/,/g, '.'));
  };

  const calculate = (a: number, b: number, op: Operator): number => {
    switch (op) {
      case '÷':
        return b === 0 ? NaN : a / b;
      case '×':
        return a * b;
      case '−':
        return a - b;
      case '+':
        return a + b;
    }
  };

  const handleDigit = (digit: string) => {
    if (waitingForNext) {
      setDisplay(digit);
      setWaitingForNext(false);
      return;
    }

    if (display === '0') {
      setDisplay(digit);
    } else {
      const cleanLen = display.replace(/[,-]/g, '').length;
      if (cleanLen < 9) {
        setDisplay(display + digit);
      }
    }
  };

  const handleComma = () => {
    if (waitingForNext) {
      setDisplay('0,');
      setWaitingForNext(false);
      return;
    }

    if (!display.includes(',')) {
      setDisplay(display + ',');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setExpression('');
    setPrevValue(null);
    setCurrentOp(null);
    setLastOperand(null);
    setLastOp(null);
    setWaitingForNext(false);
  };

  const handleBackspace = () => {
    if (waitingForNext) return;

    if (display.length > 1) {
      const nextVal = display.slice(0, -1);
      if (nextVal === '-' || nextVal === '') {
        setDisplay('0');
      } else {
        setDisplay(nextVal);
      }
    } else {
      setDisplay('0');
    }
  };

  const handlePlusMinus = () => {
    if (display === '0') return;
    if (display.startsWith('-')) {
      setDisplay(display.slice(1));
    } else {
      setDisplay('-' + display);
    }
  };

  const handlePercent = () => {
    const num = getNumericValue(display);
    const res = num / 100;
    const resStr = String(res).replace(/\./g, ',');
    setDisplay(resStr);
  };

  const handleOperator = (op: Operator) => {
    const currentNum = getNumericValue(display);

    if (waitingForNext && currentOp !== null) {
      setCurrentOp(op);
      setExpression(`${formatDisplay(String(prevValue ?? currentNum))} ${op}`);
      return;
    }

    if (prevValue !== null && currentOp !== null) {
      const result = calculate(prevValue, currentNum, currentOp);
      if (isNaN(result) || !isFinite(result)) {
        setDisplay('Error');
        setExpression('');
        setPrevValue(null);
        setCurrentOp(null);
        setWaitingForNext(true);
        return;
      }
      const formatted = String(result).replace(/\./g, ',');
      setDisplay(formatted);
      setPrevValue(result);
      setExpression(`${formatDisplay(String(result))} ${op}`);
    } else {
      setPrevValue(currentNum);
      setExpression(`${formatDisplay(display)} ${op}`);
    }

    setCurrentOp(op);
    setWaitingForNext(true);
  };

  const handleEqual = () => {
    const currentNum = getNumericValue(display);

    if (currentOp !== null && prevValue !== null) {
      const result = calculate(prevValue, currentNum, currentOp);

      if (isNaN(result) || !isFinite(result)) {
        setDisplay('Error');
        setExpression('');
        setPrevValue(null);
        setCurrentOp(null);
        setWaitingForNext(true);
        return;
      }

      const formattedResult = String(result).replace(/\./g, ',');
      setExpression(`${formatDisplay(String(prevValue))} ${currentOp} ${formatDisplay(display)} =`);
      setDisplay(formattedResult);
      setLastOperand(currentNum);
      setLastOp(currentOp);
      setPrevValue(null);
      setCurrentOp(null);
      setWaitingForNext(true);
    } else if (lastOp !== null && lastOperand !== null) {
      const result = calculate(currentNum, lastOperand, lastOp);

      if (isNaN(result) || !isFinite(result)) {
        setDisplay('Error');
        setExpression('');
        setPrevValue(null);
        setCurrentOp(null);
        setWaitingForNext(true);
        return;
      }

      const formattedResult = String(result).replace(/\./g, ',');
      setExpression(`${formatDisplay(display)} ${lastOp} ${formatDisplay(String(lastOperand))} =`);
      setDisplay(formattedResult);
      setWaitingForNext(true);
    }
  };

  const isOpActive = (op: Operator) => currentOp === op && waitingForNext;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden />

      <View style={styles.header}>
        <View style={styles.headerCircleBtn}>
          <Image
            source={require('@/assets/images/list.bullet.svg')}
            style={styles.headerBulletIcon}
            contentFit="contain"
          />
        </View>

        <View style={styles.headerCircleBtn}>
          <Image
            source={require('@/assets/images/ICONS.svg')}
            style={styles.topCalcIcon}
            contentFit="contain"
          />
        </View>
      </View>

      <View style={styles.displayContainer}>
        <Text style={styles.expressionText}>{expression || ' '}</Text>
        <Text
          style={styles.resultText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.4}
        >
          {formatDisplay(display)}
        </Text>
      </View>

      <View style={styles.keyboardContainer}>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.button, styles.utilityButton]}
            activeOpacity={0.6}
            onPress={handleBackspace}
          >
            <Image
              source={require('@/assets/images/delete.left.svg')}
              style={styles.deleteIcon}
              contentFit="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.utilityButton]}
            activeOpacity={0.6}
            onPress={handleClear}
          >
            <Text style={[styles.buttonText, styles.acText]}>AC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.utilityButton]}
            activeOpacity={0.6}
            onPress={handlePercent}
          >
            <Image
              source={require('@/assets/images/percent.svg')}
              style={styles.percentIcon}
              contentFit="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.operatorButton,
              isOpActive('÷') && styles.operatorButtonActive,
            ]}
            activeOpacity={0.6}
            onPress={() => handleOperator('÷')}
          >
            <Image
              source={require('@/assets/images/divide.svg')}
              style={[styles.divideIcon, isOpActive('÷') && styles.operatorIconActive]}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => handleDigit('7')}
          >
            <Text style={styles.buttonText}>7</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => handleDigit('8')}
          >
            <Text style={styles.buttonText}>8</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => handleDigit('9')}
          >
            <Text style={styles.buttonText}>9</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.operatorButton,
              isOpActive('×') && styles.operatorButtonActive,
            ]}
            activeOpacity={0.6}
            onPress={() => handleOperator('×')}
          >
            <Image
              source={require('@/assets/images/multiply.svg')}
              style={[styles.multiplyIcon, isOpActive('×') && styles.operatorIconActive]}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => handleDigit('4')}
          >
            <Text style={styles.buttonText}>4</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => handleDigit('5')}
          >
            <Text style={styles.buttonText}>5</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => handleDigit('6')}
          >
            <Text style={styles.buttonText}>6</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.operatorButton,
              isOpActive('−') && styles.operatorButtonActive,
            ]}
            activeOpacity={0.6}
            onPress={() => handleOperator('−')}
          >
            <Image
              source={require('@/assets/images/minus.svg')}
              style={[styles.minusIcon, isOpActive('−') && styles.operatorIconActive]}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => handleDigit('1')}
          >
            <Text style={styles.buttonText}>1</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => handleDigit('2')}
          >
            <Text style={styles.buttonText}>2</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => handleDigit('3')}
          >
            <Text style={styles.buttonText}>3</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.operatorButton,
              isOpActive('+') && styles.operatorButtonActive,
            ]}
            activeOpacity={0.6}
            onPress={() => handleOperator('+')}
          >
            <Image
              source={require('@/assets/images/plus.svg')}
              style={[styles.plusIcon, isOpActive('+') && styles.operatorIconActive]}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={handlePlusMinus}
          >
            <Image
              source={require('@/assets/images/plus.forwardslash.minus.svg')}
              style={styles.plusMinusIcon}
              contentFit="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={() => handleDigit('0')}
          >
            <Text style={styles.buttonText}>0</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.6}
            onPress={handleComma}
          >
            <Text style={styles.buttonText}>,</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.operatorButton]}
            activeOpacity={0.6}
            onPress={handleEqual}
          >
            <Image
              source={require('@/assets/images/equal.svg')}
              style={styles.equalIcon}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    height: 48,
  },
  headerCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBulletIcon: {
    width: 20,
    height: 14,
  },
  topCalcIcon: {
    width: 16,
    height: 22,
  },
  displayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  expressionText: {
    fontSize: 26,
    color: '#8E8E93',
    fontWeight: '400',
    textAlign: 'right',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  resultText: {
    fontSize: 82,
    color: '#FFFFFF',
    fontWeight: '300',
    textAlign: 'right',
    letterSpacing: -2,
  },
  keyboardContainer: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: Platform.OS === 'ios' ? 24 : 32,
    gap: BUTTON_GAP,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: BUTTON_GAP,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#2C2C2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityButton: {
    backgroundColor: '#505050',
  },
  operatorButton: {
    backgroundColor: '#FF9F0A',
  },
  operatorButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  operatorIconActive: {
    tintColor: '#FF9F0A',
  },
  buttonText: {
    fontSize: 34,
    color: '#FFFFFF',
    fontWeight: '400',
  },
  acText: {
    fontSize: 30,
  },
  deleteIcon: {
    width: 36,
    height: 36,
  },
  percentIcon: {
    width: 32,
    height: 35,
  },
  divideIcon: {
    width: 34,
    height: 31,
  },
  multiplyIcon: {
    width: 30,
    height: 30,
  },
  minusIcon: {
    width: 30,
    height: 20,
  },
  plusIcon: {
    width: 32,
    height: 32,
  },
  plusMinusIcon: {
    width: 34,
    height: 37,
  },
  equalIcon: {
    width: 32,
    height: 24,
  },
});
