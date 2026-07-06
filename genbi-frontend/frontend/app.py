import streamlit as st
import requests

# ── Config ──────────────────────────────────────────────
API = "http://127.0.0.1:8000"

st.set_page_config(
    page_title="GenBI",
    page_icon="🔮",
    layout="wide",
    initial_sidebar_state="expanded"
)

# ── Custom CSS ───────────────────────────────────────────
st.markdown("""
<style>
    .stApp { background-color: #0e1117; }
    
    [data-testid="stSidebar"] {
        background-color: #161b22;
        border-right: 1px solid #30363d;
    }
    
    .card {
        background-color: #161b22;
        border: 1px solid #30363d;
        border-radius: 12px;
        padding: 24px;
        margin-bottom: 16px;
    }
    
    .main-title {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(90deg, #f78166, #bc8cff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0;
    }
    
    .subtitle {
        color: #8b949e;
        font-size: 1rem;
        margin-top: 4px;
    }

    .answer-box {
        background-color: #1c2128;
        border-left: 4px solid #f78166;
        border-radius: 8px;
        padding: 16px;
        margin-top: 12px;
        color: #e6edf3;
    }

    /* Orange buttons */
    .stButton > button {
        background-color: #f78166 !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        transition: opacity 0.2s;
    }

    .stButton > button:hover {
        opacity: 0.85 !important;
        color: white !important;
    }
</style>
""", unsafe_allow_html=True)

# ── Session State ────────────────────────────────────────
if "token" not in st.session_state:
    st.session_state.token = None
if "username" not in st.session_state:
    st.session_state.username = None

# ── Helper ───────────────────────────────────────────────
def auth_headers():
    return {"Authorization": f"Bearer {st.session_state.token}"}

# ── Auth Page ────────────────────────────────────────────
def show_auth():
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown('<p class="main-title">🔮 GenBI</p>', unsafe_allow_html=True)
        st.markdown('<p class="subtitle">Generative Business Intelligence Platform</p>', unsafe_allow_html=True)
        st.markdown("---")

        tab1, tab2 = st.tabs(["🔑 Login", "✨ Sign Up"])

        with tab1:
            st.markdown("### Welcome back")
            username = st.text_input("Username", key="login_user")
            password = st.text_input("Password", type="password", key="login_pass")
            if st.button("Login", use_container_width=True, key="login_btn"):
                try:
                    res = requests.post(f"{API}/auth/login", data={
                        "username": username,
                        "password": password
                    })
                    if res.status_code == 200:
                        st.session_state.token = res.json()["access_token"]
                        st.session_state.username = username
                        st.success("Logged in successfully!")
                        st.rerun()
                    else:
                        st.error("Invalid username or password")
                except Exception as e:
                    st.error(f"Connection error: {e}")

        with tab2:
            st.markdown("### Create account")
            new_user = st.text_input("Username", key="signup_user")
            new_pass = st.text_input("Password", type="password", key="signup_pass")
            if st.button("Sign Up", use_container_width=True, key="signup_btn"):
                try:
                    res = requests.post(f"{API}/auth/signup", json={
                        "username": new_user,
                        "password": new_pass
                    })
                    if res.status_code == 200:
                        st.success("Account created! Please login.")
                    else:
                        try:
                            st.error(res.json().get("detail", "Signup failed"))
                        except:
                            st.error("Signup failed. Please try again.")
                except Exception as e:
                    st.error(f"Connection error: {e}")

# ── Main App ─────────────────────────────────────────────
def show_app():
    with st.sidebar:
        st.markdown('<p class="main-title">🔮 GenBI</p>', unsafe_allow_html=True)
        st.markdown(f'<p class="subtitle">Welcome, {st.session_state.username}! 👋</p>', unsafe_allow_html=True)
        st.markdown("---")

        page = st.radio("Navigation", [
            "📁 Upload File",
            "💬 Ask Questions",
            "📈 Forecasting",
            "🗂️ My Files",
            "📜 Query History",
        ])

        st.markdown("---")
        if st.button("🚪 Logout", use_container_width=True):
            st.session_state.token = None
            st.session_state.username = None
            st.rerun()

    if page == "📁 Upload File":
        show_upload()
    elif page == "💬 Ask Questions":
        show_query()
    elif page == "📈 Forecasting":
        show_forecast()
    elif page == "🗂️ My Files":
        show_files()
    elif page == "📜 Query History":
        show_history()

# ── Upload Page ──────────────────────────────────────────
def show_upload():
    st.markdown('<p class="main-title">📁 Upload File</p>', unsafe_allow_html=True)
    st.markdown('<p class="subtitle">Upload your CSV or Excel file to start analyzing</p>', unsafe_allow_html=True)
    st.markdown("---")

    uploaded = st.file_uploader("Choose a CSV or Excel file", type=["csv", "xlsx"])

    if uploaded:
        if st.button("Upload & Index", use_container_width=True):
            with st.spinner("Uploading and indexing file..."):
                try:
                    res = requests.post(
                        f"{API}/upload",
                        files={"file": (uploaded.name, uploaded.getvalue(), uploaded.type)},
                        headers=auth_headers()
                    )
                    if res.status_code == 200:
                        data = res.json()
                        st.success("File uploaded and indexed successfully!")
                        st.markdown(f"""
                        <div class="card">
                            <b>📄 Filename:</b> {data['filename']}<br>
                            <b>📊 Rows:</b> {data['rows']}<br>
                            <b>🗂️ Columns:</b> {', '.join(data['columns'])}<br>
                            <b>🔑 File ID:</b> <code>{data['file_id']}</code><br>
                            <b>🧩 Chunks Indexed:</b> {data['chunks_indexed']}
                        </div>
                        """, unsafe_allow_html=True)
                        st.info("💡 Copy the File ID above to use in Ask Questions.")
                    else:
                        st.error(f"Upload failed: {res.text}")
                except Exception as e:
                    st.error(f"Error: {e}")

# ── Query Page ───────────────────────────────────────────
def show_query():
    st.markdown('<p class="main-title">💬 Ask Questions</p>', unsafe_allow_html=True)
    st.markdown('<p class="subtitle">Ask anything about your uploaded data</p>', unsafe_allow_html=True)
    st.markdown("---")

    file_id = st.text_input("File ID", placeholder="Paste your file ID here")
    question = st.text_area("Your Question", placeholder="e.g. Which product had the highest sales?", height=100)

    if st.button("Ask GenBI 🔮", use_container_width=True):
        if not file_id or not question:
            st.warning("Please enter both File ID and a question.")
        else:
            with st.spinner("🔮 GenBI is thinking..."):
                try:
                    res = requests.post(
                        f"{API}/query",
                        json={"question": question, "file_id": file_id},
                        headers=auth_headers()
                    )
                    if res.status_code == 200:
                        data = res.json()
                        st.markdown("### 🤖 Answer")
                        st.markdown(f'<div class="answer-box">{data["answer"]}</div>', unsafe_allow_html=True)
                        with st.expander("📄 View Retrieved Context"):
                            st.text(data["context"])
                    else:
                        st.error(f"Query failed: {res.text}")
                except Exception as e:
                    st.error(f"Error: {e}")

# ── Forecast Page ────────────────────────────────────────
def show_forecast():
    st.markdown('<p class="main-title">📈 Forecasting</p>', unsafe_allow_html=True)
    st.markdown('<p class="subtitle">Predict future values from your time-series data</p>', unsafe_allow_html=True)
    st.markdown("---")

    uploaded = st.file_uploader("Upload time-series CSV or Excel", type=["csv", "xlsx"])

    col1, col2, col3 = st.columns(3)
    with col1:
        date_col = st.text_input("Date Column Name", value="date")
    with col2:
        value_col = st.text_input("Value Column Name", value="sales")
    with col3:
        periods = st.number_input("Periods to Forecast", min_value=1, max_value=365, value=30)

    if uploaded and st.button("Run Forecast 📈", use_container_width=True):
        with st.spinner("Running Prophet forecasting..."):
            try:
                res = requests.post(
                    f"{API}/forecast",
                    files={"file": (uploaded.name, uploaded.getvalue(), uploaded.type)},
                    data={"date_col": date_col, "value_col": value_col, "periods": periods},
                    headers=auth_headers()
                )
                if res.status_code == 200:
                    data = res.json()
                    st.success(f"Forecast completed! Predicted {data['periods_forecasted']} periods.")
                    import pandas as pd
                    df = pd.DataFrame(data["forecast"])
                    df.columns = ["Date", "Predicted", "Lower Bound", "Upper Bound"]
                    st.line_chart(df.set_index("Date")["Predicted"])
                    st.dataframe(df, use_container_width=True)
                else:
                    st.error(f"Forecast failed: {res.text}")
            except Exception as e:
                st.error(f"Error: {e}")

# ── My Files Page ────────────────────────────────────────
def show_files():
    st.markdown('<p class="main-title">🗂️ My Files</p>', unsafe_allow_html=True)
    st.markdown('<p class="subtitle">All files you have uploaded</p>', unsafe_allow_html=True)
    st.markdown("---")

    try:
        res = requests.get(f"{API}/files", headers=auth_headers())
        if res.status_code == 200:
            files = res.json()
            if not files:
                st.info("No files uploaded yet. Go to Upload File to get started.")
            for f in files:
                st.markdown(f"""
                <div class="card">
                    <b>📄 {f['filename']}</b><br>
                    <b>Rows:</b> {f['rows']} &nbsp;|&nbsp;
                    <b>Columns:</b> {', '.join(f['columns'])}<br>
                    <b>File ID:</b> <code>{f['_id']}</code>
                </div>
                """, unsafe_allow_html=True)
        else:
            st.error("Failed to load files.")
    except Exception as e:
        st.error(f"Error: {e}")

# ── Query History Page ───────────────────────────────────
def show_history():
    st.markdown('<p class="main-title">📜 Query History</p>', unsafe_allow_html=True)
    st.markdown('<p class="subtitle">Your past questions and answers</p>', unsafe_allow_html=True)
    st.markdown("---")

    try:
        res = requests.get(f"{API}/query-history", headers=auth_headers())
        if res.status_code == 200:
            history = res.json()
            if not history:
                st.info("No queries yet. Go to Ask Questions to get started.")
            for h in history:
                with st.expander(f"❓ {h['question']}"):
                    st.markdown(f'<div class="answer-box">{h["answer"]}</div>', unsafe_allow_html=True)
        else:
            st.error("Failed to load history.")
    except Exception as e:
        st.error(f"Error: {e}")

# ── Entry Point ──────────────────────────────────────────
if st.session_state.token is None:
    show_auth()
else:
    show_app()