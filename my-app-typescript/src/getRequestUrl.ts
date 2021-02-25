export function getRequestUrl(): string {
    if (process.env.NODE_ENV === "development") {
        if (process.env.REACT_APP_DEVELOPMENT_POST_URL == null) {
            throw new Error('リクエスト先URLの取得に失敗しました');
        }
        return process.env.REACT_APP_DEVELOPMENT_POST_URL;
    }
    if (process.env.NODE_ENV === "production") {
        if (process.env.REACT_APP_PRODUCITON_POST_URL == null) {
            throw new Error('リクエスト先URLの取得に失敗しました');
        }
        return process.env.REACT_APP_PRODUCITON_POST_URL;
    } else {
        throw new Error('リクエスト先URLの取得に失敗しました');
    }
}