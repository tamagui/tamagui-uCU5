import type { FontSizeTokens, SizeTokens } from 'tamagui';
export declare const AvatarIcon: import("tamagui").TamaguiComponent<Omit<import("@tamagui/web").GetFinalProps<import("@tamagui/core").RNTamaguiViewNonStyleProps, import("@tamagui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
    offset?: number | undefined;
    placement?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | undefined;
}>, "scaleIcon"> & {
    scaleIcon?: number;
}, import("tamagui").TamaguiElement, import("@tamagui/core").RNTamaguiViewNonStyleProps & {
    scaleIcon?: number;
}, import("@tamagui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
    offset?: number | undefined;
    placement?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | undefined;
}, import("@tamagui/web").StaticConfigPublic>;
export declare const Avatar: import("react").ForwardRefExoticComponent<Omit<import("@tamagui/core").RNTamaguiViewNonStyleProps, "size" | keyof import("@tamagui/web").StackStyleBase> & import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase> & {
    size?: SizeTokens | undefined;
} & import("@tamagui/web").WithShorthands<import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase>> & import("@tamagui/web").WithPseudoProps<import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase> & {
    size?: SizeTokens | undefined;
} & import("@tamagui/web").WithShorthands<import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase>>> & import("@tamagui/web").WithMediaProps<import("@tamagui/web").WithThemeShorthandsAndPseudos<import("@tamagui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
}>> & import("react").RefAttributes<import("tamagui").TamaguiElement>> & import("@tamagui/web").StaticComponentObject<import("@tamagui/web").TamaDefer, import("tamagui").TamaguiElement, import("@tamagui/core").RNTamaguiViewNonStyleProps, import("@tamagui/web").StackStyleBase, {
    size?: SizeTokens | undefined;
}, import("@tamagui/web").StaticConfigPublic> & Omit<import("@tamagui/web").StaticConfigPublic, "staticConfig" | "extractable" | "styleable"> & {
    __tama: [import("@tamagui/web").TamaDefer, import("tamagui").TamaguiElement, import("@tamagui/core").RNTamaguiViewNonStyleProps, import("@tamagui/web").StackStyleBase, {
        size?: SizeTokens | undefined;
    }, import("@tamagui/web").StaticConfigPublic];
} & {
    Content: import("react").ForwardRefExoticComponent<Omit<any, "ref"> & import("react").RefAttributes<Omit<import("@tamagui/core").RNTamaguiViewNonStyleProps, "size" | "elevation" | keyof import("@tamagui/web").StackStyleBase | "inset" | "fullscreen" | "transparent" | "hoverTheme" | "pressTheme" | "backgrounded" | "circular" | "focusTheme" | "elevate" | "bordered" | "radiused" | "padded" | "chromeless"> & import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase> & {
        elevation?: number | import("@tamagui/web").SizeTokens | undefined;
        size?: number | import("@tamagui/web").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        inset?: number | import("@tamagui/web").SizeTokens | {
            top?: number;
            bottom?: number;
            left?: number;
            right?: number;
        } | undefined;
        hoverTheme?: boolean | undefined;
        pressTheme?: boolean | undefined;
        focusTheme?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: number | boolean | undefined;
        transparent?: boolean | undefined;
        backgrounded?: boolean | undefined;
        radiused?: boolean | undefined;
        padded?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    } & import("@tamagui/web").WithShorthands<import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase>> & import("@tamagui/web").WithPseudoProps<import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase> & {
        elevation?: number | import("@tamagui/web").SizeTokens | undefined;
        size?: number | import("@tamagui/web").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        inset?: number | import("@tamagui/web").SizeTokens | {
            top?: number;
            bottom?: number;
            left?: number;
            right?: number;
        } | undefined;
        hoverTheme?: boolean | undefined;
        pressTheme?: boolean | undefined;
        focusTheme?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: number | boolean | undefined;
        transparent?: boolean | undefined;
        backgrounded?: boolean | undefined;
        radiused?: boolean | undefined;
        padded?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    } & import("@tamagui/web").WithShorthands<import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase>>> & import("@tamagui/web").WithMediaProps<import("@tamagui/web").WithThemeShorthandsAndPseudos<import("@tamagui/web").StackStyleBase, {
        elevation?: number | import("@tamagui/web").SizeTokens | undefined;
        size?: number | import("@tamagui/web").SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        circular?: boolean | undefined;
        inset?: number | import("@tamagui/web").SizeTokens | {
            top?: number;
            bottom?: number;
            left?: number;
            right?: number;
        } | undefined;
        hoverTheme?: boolean | undefined;
        pressTheme?: boolean | undefined;
        focusTheme?: boolean | undefined;
        elevate?: boolean | undefined;
        bordered?: number | boolean | undefined;
        transparent?: boolean | undefined;
        backgrounded?: boolean | undefined;
        radiused?: boolean | undefined;
        padded?: boolean | undefined;
        chromeless?: boolean | "all" | undefined;
    }>> & import("react").RefAttributes<import("tamagui").TamaguiElement>>>;
    Image: import("react").ForwardRefExoticComponent<Partial<import("tamagui").ImageProps> & {
        onLoadingStatusChange?: (status: "loaded" | "loading" | "error" | "idle") => void;
    } & import("react").RefAttributes<import("tamagui").TamaguiElement>>;
    Fallback: import("react").ForwardRefExoticComponent<Omit<import("@tamagui/core").RNTamaguiViewNonStyleProps, "elevation" | keyof import("@tamagui/web").StackStyleBase | "inset" | "fullscreen"> & import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase> & {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        inset?: number | SizeTokens | {
            top?: number;
            bottom?: number;
            left?: number;
            right?: number;
        } | undefined;
    } & import("@tamagui/web").WithShorthands<import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase>> & import("@tamagui/web").WithPseudoProps<import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase> & {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        inset?: number | SizeTokens | {
            top?: number;
            bottom?: number;
            left?: number;
            right?: number;
        } | undefined;
    } & import("@tamagui/web").WithShorthands<import("@tamagui/web").WithThemeValues<import("@tamagui/web").StackStyleBase>>> & import("@tamagui/web").WithMediaProps<import("@tamagui/web").WithThemeShorthandsAndPseudos<import("@tamagui/web").StackStyleBase, {
        elevation?: number | SizeTokens | undefined;
        fullscreen?: boolean | undefined;
        inset?: number | SizeTokens | {
            top?: number;
            bottom?: number;
            left?: number;
            right?: number;
        } | undefined;
    }>> & {
        delayMs?: number;
    } & import("react").RefAttributes<import("tamagui").TamaguiElement>>;
    Icon: import("tamagui").TamaguiComponent<Omit<import("@tamagui/web").GetFinalProps<import("@tamagui/core").RNTamaguiViewNonStyleProps, import("@tamagui/web").StackStyleBase, {
        size?: SizeTokens | undefined;
        offset?: number | undefined;
        placement?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | undefined;
    }>, "scaleIcon"> & {
        scaleIcon?: number;
    }, import("tamagui").TamaguiElement, import("@tamagui/core").RNTamaguiViewNonStyleProps & {
        scaleIcon?: number;
    }, import("@tamagui/web").StackStyleBase, {
        size?: SizeTokens | undefined;
        offset?: number | undefined;
        placement?: "top-right" | "top-left" | "bottom-right" | "bottom-left" | undefined;
    }, import("@tamagui/web").StaticConfigPublic>;
    Text: import("tamagui").TamaguiComponent<import("@tamagui/web").TamaDefer, import("tamagui").TamaguiTextElement, import("@tamagui/core").RNTamaguiTextNonStyleProps, import("@tamagui/web").TextStylePropsBase, {
        size?: FontSizeTokens | undefined;
        unstyled?: boolean | undefined;
    }, import("@tamagui/web").StaticConfigPublic>;
};
//# sourceMappingURL=Avatar.d.ts.map