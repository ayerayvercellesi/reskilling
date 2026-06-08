const NOTION_TOKEN = "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";
const NOTION_DB_ID = "2a56092b4b97427ca96943dbc196c2ef";
const NOTION_API   = "https://api.notion.com/v1";

const headers = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28"
};

exports.handler = async function(event) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: cors, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: "Method not allowed" };
  }

  try {
    const payload = JSON.parse(event.body);
    const { properties, persona } = payload;

    if (!persona) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Sin nombre de colaborador" }) };
    }

    // Buscar si ya existe una página para este colaborador
    const searchRes = await fetch(`${NOTION_API}/databases/${NOTION_DB_ID}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filter: { property: "Colaborador", title: { equals: persona } }
      })
    });
    const searchData = await searchRes.json();

    let pageId = null;
    if (searchData.results && searchData.results.length > 0) {
      pageId = searchData.results[0].id;
    }

    if (pageId) {
      // Actualizar página existente
      await fetch(`${NOTION_API}/pages/${pageId}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ properties })
      });
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, action: "updated", pageId }) };
    } else {
      // Crear nueva página
      const createRes = await fetch(`${NOTION_API}/pages`, {
        method: "POST",
        headers,
        body: JSON.stringify({ parent: { database_id: NOTION_DB_ID }, properties })
      });
      const createData = await createRes.json();
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true, action: "created", pageId: createData.id }) };
    }

  } catch (e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }
};
