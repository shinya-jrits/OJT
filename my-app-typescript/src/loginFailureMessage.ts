export function loginFailureMessage(message: string): string {
    switch (message) {
        case "popup_closed_by_user": return "ユーザがサインインを完了する前にポップアップ画面を閉じました。";
        case "idpiframe_initialization_failed": return "ブラウザの設定でサードパーティのCookieが有効になっているかご確認ください。";
        case "access_denied": return "ユーザが必要なスコープへのアクセス許可を拒否しました。";
        case "immediate_failed": return "同意フローを要求せずにユーザーを自動的に選択することはできません。";
    }
    return "不明なエラーが発生しました";
}