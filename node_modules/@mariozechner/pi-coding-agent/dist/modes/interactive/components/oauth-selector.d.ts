import { Container, type Focusable } from "@mariozechner/pi-tui";
import type { AuthStorage } from "../../../core/auth-storage.js";
export type AuthSelectorProvider = {
    id: string;
    name: string;
    authType: "oauth" | "api_key";
};
/**
 * Component that renders an auth provider selector
 */
export declare class OAuthSelectorComponent extends Container implements Focusable {
    private searchInput;
    private _focused;
    get focused(): boolean;
    set focused(value: boolean);
    private listContainer;
    private allProviders;
    private filteredProviders;
    private selectedIndex;
    private mode;
    private authStorage;
    private onSelectCallback;
    private onCancelCallback;
    constructor(mode: "login" | "logout", authStorage: AuthStorage, providers: AuthSelectorProvider[], onSelect: (providerId: string) => void, onCancel: () => void);
    private filterProviders;
    private updateList;
    private formatStatusIndicator;
    handleInput(keyData: string): void;
}
//# sourceMappingURL=oauth-selector.d.ts.map