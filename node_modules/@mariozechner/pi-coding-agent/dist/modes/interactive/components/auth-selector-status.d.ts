import type { AuthCredential, AuthStatus } from "../../../core/auth-storage.js";
export type SelectorAuthType = "oauth" | "api_key";
export type AuthSelectorIndicator = {
    kind: "configured";
    label: string;
} | {
    kind: "configured-other";
    label: string;
} | {
    kind: "runtime";
} | {
    kind: "environment";
    label: string;
} | {
    kind: "fallback";
} | {
    kind: "unconfigured";
};
export declare function getAuthSelectorIndicator(authType: SelectorAuthType, credential: AuthCredential | undefined, authStatus?: AuthStatus): AuthSelectorIndicator;
//# sourceMappingURL=auth-selector-status.d.ts.map