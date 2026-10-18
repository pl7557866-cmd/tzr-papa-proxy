
from flask import (
    Blueprint,
    render_template,
    request,
    jsonify,
    session,
    redirect,
    url_for,
)
from database import Database

user_bp = Blueprint("user", __name__)
db = Database()


@user_bp.route("/")
def index():
    """User landing page."""
    return render_template("user/index.html")


@user_bp.route("/activate", methods=["GET", "POST"])
def activate():
    """License activation page."""
    if request.method == "POST":
        license_key = request.form.get("license_key", "").strip()
        device_id = request.form.get("device_id", "").strip()

        if not license_key:
            return render_template(
                "user/activate.html",
                error="Please enter a license key.",
            )

        license_data = db.validate_license(license_key)

        if license_data:
            session["user_activated"] = True
            session["license_key"] = license_key
            session["tier"] = license_data["tier"]
            session["expiry"] = license_data["expiry_date"]

            db.register_device(
                license_key,
                device_id,
                request.remote_addr,
            )
            return redirect(url_for("user.dashboard"))

        return render_template(
            "user/activate.html",
            error="Invalid or expired license",
        )

    return render_template("user/activate.html")


@user_bp.route("/dashboard")
def dashboard():
    """User dashboard."""
    if not session.get("user_activated"):
        return redirect(url_for("user.activate"))

    features = db.get_feature_toggles(
        session.get("license_key")
    )

    return render_template(
        "user/dashboard.html",
        features=features,
        license_key=session.get("license_key"),
    )


@user_bp.route("/logout")
def logout():
    """User logout."""
    session.pop("user_activated", None)
    session.pop("license_key", None)
    session.pop("tier", None)
    session.pop("expiry", None)

    return redirect(url_for("user.index"))


@user_bp.route("/features")
def features():
    """User feature center."""
    if not session.get("user_activated"):
        return redirect(url_for("user.activate"))

    feature_map = db.get_feature_toggles(
        session.get("license_key")
    )

    return render_template(
        "user/features.html",
        features=feature_map,
    )


@user_bp.route("/toggle-feature", methods=["POST"])
def toggle_feature():
    """Save a feature toggle for the active license."""
    if not session.get("user_activated"):
        return jsonify({
            "ok": False,
            "error": "Not activated",
        }), 401

    payload = request.get_json(silent=True) or {}
    feature = str(payload.get("feature", "")).strip()
    enabled = payload.get("enabled", False)

    if not isinstance(enabled, bool):
        return jsonify({
            "ok": False,
            "error": "enabled must be true or false",
        }), 400

    allowed = {
        item["name"] for item in db.get_all_features()
    }

    if feature not in allowed:
        return jsonify({
            "ok": False,
            "error": "Unknown feature",
        }), 400

    db.set_feature_toggle(
        session.get("license_key"),
        feature,
        enabled,
    )

    return jsonify({
        "ok": True,
        "feature": feature,
        "enabled": enabled,
    })
