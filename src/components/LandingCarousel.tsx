import { useCallback, useEffect, useRef } from 'react';
import { FlatList, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedScrollHandler, type SharedValue } from 'react-native-reanimated';

import { LandingSlide } from '@/components/LandingSlide';
import { landingSlides, type LandingSlide as Slide } from '@/constants/landingSlides';

const AUTOPLAY_MS = 4000;
const RESUME_MS = 3000;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Slide>);

type LandingCarouselProps = {
  height: number;
  imageHeight: number;
  scrollX: SharedValue<number>;
};

export function LandingCarousel({ height, imageHeight, scrollX }: LandingCarouselProps) {
  const { width } = useWindowDimensions();

  const listRef = useRef<FlatList<Slide>>(null);
  const indexRef = useRef(0);
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.set(e.contentOffset.x);
  });

  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) clearInterval(autoplayRef.current);
    if (resumeRef.current) clearTimeout(resumeRef.current);
    autoplayRef.current = null;
    resumeRef.current = null;
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    autoplayRef.current = setInterval(() => {
      const next = (indexRef.current + 1) % landingSlides.length;
      indexRef.current = next;
      listRef.current?.scrollToIndex({ index: next, animated: true });
    }, AUTOPLAY_MS);
  }, [stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  return (
    <AnimatedFlatList
      ref={listRef}
      data={landingSlides}
      keyExtractor={(slide) => slide.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      onScroll={onScroll}
      onMomentumScrollEnd={(e) => {
        indexRef.current = Math.round(e.nativeEvent.contentOffset.x / width);
      }}
      onScrollBeginDrag={stopAutoplay}
      onScrollEndDrag={() => {
        resumeRef.current = setTimeout(startAutoplay, RESUME_MS);
      }}
      style={{ height }}
      renderItem={({ item, index }) => (
        <LandingSlide
          slide={item}
          index={index}
          width={width}
          height={height}
          imageHeight={imageHeight}
          scrollX={scrollX}
        />
      )}
    />
  );
}
