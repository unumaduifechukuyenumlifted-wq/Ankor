/** Screen 20 — AI Chat ("Ask Anchor"): suggested chips, bubbles, typing indicator, input + mic. */
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LoadingDots } from '../../src/components/SuccessCheck';
import { C, T } from '../../src/theme';
import { useApp, firstName } from '../../src/store/AppProvider';
import { aiReply, SUGGESTED_QUESTIONS } from '../../src/lib/ai';

export default function AiChat() {
  const insets = useSafeAreaInsets();
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [state.chat.length, thinking]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q || thinking) return;
    setInput('');
    dispatch({ type: 'PUSH_CHAT', role: 'user', text: q });
    setThinking(true);
    setTimeout(() => {
      dispatch({ type: 'PUSH_CHAT', role: 'ai', text: aiReply(q, state) });
      setThinking(false);
    }, 900 + Math.random() * 500);
  };

  return (
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: '#FCF9F0' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.logoDot}>
            <Ionicons name="sparkles" size={16} color={C.gold} />
          </View>
          <View style={{ marginLeft: 10 }}>
            <Text style={{ fontFamily: 'PlayfairDisplay_700Bold', fontSize: 21, color: C.navy }}>Ask Anchor</Text>
            <Text style={{ ...T.small, marginTop: 1 }}>Your AI coach knows your budget and goals.</Text>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
        {state.chat.length === 0 && !thinking ? (
          <View style={{ alignItems: 'center', marginTop: 26 }}>
            <View style={styles.helloIcon}>
              <Ionicons name="sparkles" size={26} color={C.gold} />
            </View>
            <Text style={{ ...T.h2, textAlign: 'center', marginTop: 14 }}>Hi {firstName(state.user?.name ?? 'friend')} 👋</Text>
            <Text style={{ ...T.body, color: C.gray, textAlign: 'center', marginTop: 6, maxWidth: 280 }}>
              Ask me anything about your money — I've got your full budget in mind.
            </Text>
          </View>
        ) : null}

        {state.chat.map((m) => (
          <View
            key={m.id}
            style={[styles.bubbleWrap, m.role === 'user' ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}
          >
            <View style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
              <Text style={{ ...T.body, color: m.role === 'user' ? C.onNavy : C.ink, fontSize: 14.5, lineHeight: 21 }}>{m.text}</Text>
            </View>
          </View>
        ))}

        {thinking ? (
          <View style={styles.bubbleWrap}>
            <View style={[styles.bubble, styles.bubbleAi, { flexDirection: 'row', alignItems: 'center' }]}>
              <LoadingDots size={7} />
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Suggested chips */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          {SUGGESTED_QUESTIONS.map((q) => (
            <Pressable key={q} onPress={() => send(q)} style={({ pressed }) => [styles.chip, pressed && { opacity: 0.75 }]}>
              <Ionicons name="sparkles-outline" size={12} color={C.goldDeep} style={{ marginRight: 6 }} />
              <Text style={{ ...T.small500, color: C.navy, fontSize: 12.5 }}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Input bar */}
      <View style={{ paddingHorizontal: 12, paddingBottom: insets.bottom + 10, paddingTop: 4 }}>
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={listening ? 'Listening…' : 'Ask about your money…'}
            placeholderTextColor={C.graySoft}
            style={{ flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14.5, color: C.navy, paddingHorizontal: 6, paddingVertical: 0 }}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <Pressable
            onPress={() => setListening((l) => !l)}
            style={[styles.micBtn, listening && { backgroundColor: C.terracotta }]}
            hitSlop={8}
          >
            <Ionicons name="mic" size={17} color={listening ? C.white : C.gray} />
          </Pressable>
          <Pressable onPress={() => send(input)} disabled={!input.trim()} style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}>
            <Ionicons name="arrow-up" size={18} color={C.white} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.bg },
  logoDot: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  helloIcon: { width: 74, height: 74, borderRadius: 37, backgroundColor: C.goldSoft, alignItems: 'center', justifyContent: 'center' },
  bubbleWrap: { flexDirection: 'row', marginBottom: 10 },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAi: { backgroundColor: '#F1E7D2', borderBottomLeftRadius: 6 },
  bubbleUser: { backgroundColor: C.navy, borderBottomRightRadius: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 24,
    paddingLeft: 14,
    paddingRight: 6,
    height: 52,
  },
  micBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bgDeep, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
});
