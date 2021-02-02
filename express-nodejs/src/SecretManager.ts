import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

/**
 * SecretManagerからシークレット値を取り出す
 * @param secretId シークレットの名前
 */
export async function getSecretManagerValue(secretId: string): Promise<string | null> {
    const client = new SecretManagerServiceClient();
    const [accessResponse] = await client.accessSecretVersion({
        name: 'projects/483600820879/secrets/' + secretId + '/versions/latest',
    })
    if (accessResponse.payload?.data == null) {
        return null;
    } else {
        const responsePayload = accessResponse.payload.data.toString();
        return responsePayload;
    }
}