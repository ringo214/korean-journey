/* ================================================
   Cloudflare Worker · 添削の中継サーバー
   
   このファイルを Cloudflare Workers にコピペする。
   APIキーは Workers の「環境変数」に ANTHROPIC_API_KEY という名前で登録する。
   （このファイルにキーを書かないこと！）
   
   詳しい手順は SETUP.md を見てね。
   ================================================ */

export default {
  async fetch(request, env) {
    // CORS: ブラウザからのアクセスを許可
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // プリフライトリクエスト（ブラウザの事前確認）に応答
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "POST only" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const { sentence } = await request.json();

      if (!sentence || typeof sentence !== "string" || sentence.length > 500) {
        return new Response(JSON.stringify({ error: "文が空か、長すぎます(500字まで)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Anthropic API を呼ぶ（キーは環境変数から）
      const apiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 600,
          messages: [
            {
              role: "user",
              content: `あなたは日本語話者向けの韓国語の先生です。学習者(TOPIK I レベル・初級)が書いた韓国語の文を添削してください。

学習者の文: ${sentence}

以下の形式で、日本語で簡潔に返してください(全体で6行以内):
✅ 直した文: (正しい韓国語。元の文が正しければそのまま)
📝 ポイント: (直した理由を1〜2点だけ。文法用語は最小限に、やさしく)
💬 ひとこと: (励ましを一言。良かった点を必ず1つ挙げる)

学習者は褒められると伸びるタイプ。ダメ出しではなく「ここまで書けてる」を軸に。`,
            },
          ],
        }),
      });

      const data = await apiRes.json();

      if (data && data.content) {
        const text = data.content
          .map((i) => (i.type === "text" ? i.text : ""))
          .filter(Boolean)
          .join("\n");
        return new Response(JSON.stringify({ correction: text }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "APIから予期しない応答", detail: data }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "サーバーエラー: " + err.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
