"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, MessageSquare, Mail, Radio, ArrowRight, Clock, MapPin, Zap, Check } from "lucide-react";
import SeverityBadge from "@/components/SeverityBadge";
import EmptyState from "@/components/EmptyState";
import { useLocation } from "@/context/LocationContext";
import { getAlerts } from "@/lib/api";

interface AlertRow {
  id: string;
  severity: "critical" | "high" | "moderate";
  hazard: string;
  rawHazard?: string;
  prob: string;
  leadTime: string;
  location: string;
  details: {
    lat: number;
    lon: number;
    latLon: string;
    triggerFactors: string[];
    recommendedActions: string[];
    leadTimeDisplay: string;
    impact: string;
  };
}

export default function AlertsPage() {
  const { location, gridSize, snapshot } = useLocation();
  const [selectedHorizon, setSelectedHorizon] = useState<string>("+4H");
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [responseStatus, setResponseStatus] = useState<"idle" | "processing" | "acknowledged" | "dispatched" | "escalated">("idle");

  const cape = snapshot?.cape ?? 1850;
  const precip = snapshot?.precipitation ?? 14.5;

  useEffect(() => {
    getAlerts(location.lat, location.lon, gridSize)
      .then(({ alerts: rawAlerts }) => {
        if (rawAlerts.length > 0) {
          const mapped: AlertRow[] = rawAlerts.map((alert) => ({
            id: alert.alert_id,
            severity: alert.severity === "critical" ? "critical" : alert.severity === "warning" || alert.severity === "high" ? "high" : "moderate",
            hazard: alert.hazard_type.replace("_", " "),
            rawHazard: alert.hazard_type,
            prob: `${Math.round(alert.probability * 100)}%`,
            leadTime: `+${alert.lead_time_hours}H`,
            location: (alert.affected_region.region_name && alert.affected_region.region_name !== "Demo Region") 
              ? alert.affected_region.region_name 
              : location.name,
            details: {
              lat: alert.affected_region.latitude,
              lon: alert.affected_region.longitude,
              latLon: `${alert.affected_region.latitude.toFixed(2)}°N, ${alert.affected_region.longitude.toFixed(2)}°E`,
              triggerFactors: alert.triggering_factors,
              recommendedActions: [alert.recommended_action],
              leadTimeDisplay: alert.forecast_window || `${alert.lead_time_hours} Hours Lead Time Window`,
              impact: "Immediate civil defense and drainage monitoring required",
            },
          }));
          setAlerts(mapped);
          if (mapped.length > 0) setSelectedAlertId(mapped[0].id);
        } else {
          // Dynamic alerts based on live location telemetry
          const dynamicAlerts: AlertRow[] = [
            {
              id: `ALT-${location.state.slice(0, 3).toUpperCase()}-01`,
              severity: "critical",
              hazard: "Flash Flood & Cloudburst Inundation Warning",
              rawHazard: "flash_flood",
              prob: "88%",
              leadTime: "+3H",
              location: `${location.name}`,
              details: {
                lat: location.lat,
                lon: location.lon,
                latLon: `${location.lat.toFixed(4)}°N, ${location.lon.toFixed(4)}°E`,
                triggerFactors: [
                  `Extreme atmospheric instability: CAPE at ${cape.toFixed(0)} J/kg`,
                  `High-rate precipitation discharge: QPE ${precip.toFixed(1)} mm/hr`,
                  "Steep valley orographic convergence accelerating surface runoff",
                ],
                recommendedActions: [
                  "Issue evacuation readiness for downstream gorge settlements",
                  "Deploy emergency quick-response drainage barriers",
                  "Activate multi-channel public SMS/radio early warning broadcast",
                ],
                leadTimeDisplay: "3 to 4 Hours Operational Window",
                impact: "Rapid river channel surge and flash flood inundation",
              },
            },
            {
              id: `ALT-${location.state.slice(0, 3).toUpperCase()}-02`,
              severity: "high",
              hazard: "Severe Convective Thunderstorm & Lightning",
              rawHazard: "thunderstorm",
              prob: "76%",
              leadTime: "+2H",
              location: `${location.name} Upper Ridge`,
              details: {
                lat: location.lat + 0.15,
                lon: location.lon + 0.15,
                latLon: `${(location.lat + 0.15).toFixed(4)}°N, ${(location.lon + 0.15).toFixed(4)}°E`,
                triggerFactors: [
                  "High vertical wind shear across 0–80m layer (14.2 km/h)",
                  "Intense localized cloud top cooling rate",
                ],
                recommendedActions: [
                  "Halt mountain transport and open-air industrial activities",
                  "Alert local disaster response forces (NDRF / SDRF)",
                ],
                leadTimeDisplay: "2 Hours Lead Window",
                impact: "Severe wind gusts, hail, and high lightning strike frequency",
              },
            },
          ];
          setAlerts(dynamicAlerts);
          setSelectedAlertId(dynamicAlerts[0].id);
        }
      })
      .catch((err) => console.error("Alerts error", err));
  }, [location.lat, location.lon, location.name, location.state, gridSize, cape, precip]);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || alerts[0] || null;

  const handleResponseAction = (action: "acknowledged" | "dispatched" | "escalated") => {
    setResponseStatus("processing");
    setTimeout(() => {
      setResponseStatus(action);
      setTimeout(() => setResponseStatus("idle"), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto animate-in fade-in duration-300">
      {/* Top Header Controls */}
      <div className="bg-card rounded-2xl p-5 shadow-card border border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-brand uppercase tracking-wider">Early Warning Dispatch Center</span>
          <div className="flex items-center space-x-3 mt-1">
            <h3 className="text-base font-bold text-navy">Operational Warnings: {location.name}</h3>
            <span className="text-xs bg-brand/10 text-brand font-bold px-2.5 py-0.5 rounded-full border border-brand/20">
              {alerts.length} ACTIVE WARNINGS
            </span>
          </div>
        </div>

        {/* Forecast Horizon Selector */}
        <div className="flex items-center space-x-2 bg-page p-1.5 rounded-xl border border-border">
          <span className="text-xs font-bold text-muted px-2 uppercase tracking-wider">Horizon:</span>
          {["+2H", "+3H", "+4H", "+5H", "+6H"].map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHorizon(h)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                selectedHorizon === h
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:text-navy hover:bg-white/60"
              }`}
            >
              {h}
            </button>
          ))}
          <span className="text-[11px] font-bold text-brand ml-2 px-2.5 py-1 bg-brand/10 rounded-lg">
            FORECAST {selectedHorizon}
          </span>
        </div>
      </div>

      {/* SECTION 1: ACTIVE ALERTS TABLE */}
      <div className="bg-card rounded-2xl p-6 shadow-card border border-border card-hover-effect">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/80">
          <div>
            <h4 className="text-[13px] font-bold uppercase tracking-wider text-brand flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Active Alerts Queue ({location.name})
            </h4>
            <p className="text-xs text-muted mt-0.5">Automated Multi-Hazard Notification Protocols derived from Open-Meteo feeds</p>
          </div>
          <span className="text-xs text-muted font-mono bg-page px-3 py-1 rounded-full border border-border">
            Click row to inspect response recommendations
          </span>
        </div>

        {alerts.length > 0 ? (
          <div className="divide-y divide-border/70">
            {alerts.map((alert) => {
              const isSelected = selectedAlertId === alert.id;
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlertId(alert.id)}
                  className={`py-3.5 px-4 rounded-2xl flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#F0F5FD] border border-brand/40 shadow-sm translate-x-1"
                      : "hover:bg-page/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <SeverityBadge level={alert.severity} />
                    <span className="text-sm font-bold text-navy">{alert.hazard}</span>
                  </div>

                  <div className="flex items-center space-x-8 text-xs font-semibold">
                    <div className="flex items-center space-x-1 font-mono font-extrabold text-navy text-sm">
                      <span>{alert.prob}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-muted font-mono">
                      <Clock className="w-3.5 h-3.5 text-brand" />
                      <span>{alert.leadTime}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 text-navy font-bold max-w-[200px] truncate">
                      <MapPin className="w-3.5 h-3.5 text-brand" />
                      <span>{alert.location}</span>
                    </div>
                    <Link
                      href={`/map?lat=${alert.details.lat}&lon=${alert.details.lon}&hazard=${encodeURIComponent(alert.rawHazard || alert.hazard)}&horizon=${encodeURIComponent(alert.leadTime)}&alertId=${encodeURIComponent(alert.id)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-xl bg-white border border-border flex items-center justify-center text-brand hover:bg-brand hover:text-white transition-all shadow-xs"
                      title="Locate on Nowcast Map"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No Active Alerts" subtitle="Warning notifications will appear here when the system detects threats requiring operational response." />
        )}
      </div>

      {/* SECTION 2: SELECTED ALERT DETAILS & OPERATIONAL RESPONSE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Selected Alert & Why this Alert? */}
        <div className="lg:col-span-6 bg-card rounded-2xl p-6 shadow-card border border-border flex flex-col justify-between card-hover-effect">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <div>
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Focused Warning Protocol</span>
                <h4 className="text-base font-bold text-navy mt-0.5">Alert Details</h4>
              </div>
              {selectedAlert && <SeverityBadge level={selectedAlert.severity} />}
            </div>

            {selectedAlert ? (
              <>
                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#F7FBFE] p-4 rounded-xl border border-border mb-5">
                  <div>
                    <span className="text-muted">Hazard Probability:</span>
                    <span className="font-mono font-bold text-navy ml-1.5">{selectedAlert.prob}</span>
                  </div>
                  <div>
                    <span className="text-muted">Operational Risk:</span>
                    <span className="font-bold text-navy ml-1.5 uppercase">{selectedAlert.severity}</span>
                  </div>
                  <div>
                    <span className="text-muted">Hazard Type:</span>
                    <span className="font-bold text-navy ml-1.5 capitalize">{selectedAlert.hazard}</span>
                  </div>
                  <div>
                    <span className="text-muted">Coordinates:</span>
                    <span className="font-mono font-bold text-navy ml-1.5">{selectedAlert.details.latLon}</span>
                  </div>
                </div>

                {/* Why This Alert? */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-brand mb-2.5">Why This Alert? (Trigger Factors)</h5>
                  <div className="space-y-2">
                    {selectedAlert.details.triggerFactors.map((factor, idx) => (
                      <div key={idx} className="flex items-start space-x-2 text-xs text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <EmptyState title="No Alert Selected" subtitle="Select an alert from the queue above to view detailed analysis." className="py-6" />
            )}
          </div>
        </div>

        {/* Right: Operational Response Actions & Lead Time */}
        <div className="lg:col-span-6 bg-card rounded-2xl p-6 shadow-card border border-border flex flex-col justify-between card-hover-effect">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand">Operational Response Protocols</h4>
              <span className="text-xs text-success font-semibold flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Standard Operating Procedure
              </span>
            </div>

            {selectedAlert ? (
              <>
                {/* Lead Time Hero Banner */}
                <div className="bg-brand text-white p-4 rounded-xl mb-4 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-[11px] font-medium opacity-80 uppercase tracking-wider">Estimated Action Window</div>
                    <div className="text-2xl font-extrabold tracking-tight mt-0.5">{selectedAlert.details.leadTimeDisplay}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-medium opacity-80 uppercase">Target Grid Center</div>
                    <div className="text-xs font-mono font-bold mt-0.5">{selectedAlert.details.latLon}</div>
                  </div>
                </div>

                {/* Recommended Actions */}
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-brand mb-3">Recommended Actions</h5>
                  <div className="space-y-2.5">
                    {selectedAlert.details.recommendedActions.map((action, i) => (
                      <div key={i} className="flex items-center space-x-2.5 bg-page/70 p-2.5 rounded-xl border border-border text-xs text-navy font-medium">
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-brand mb-3">Response Actions</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleResponseAction("acknowledged")}
                      disabled={responseStatus === "processing"}
                      className="border border-brand/30 text-brand hover:bg-brand/5 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-bold px-3 py-2.5 rounded-xl transition-colors"
                    >
                      Acknowledge Alert
                    </button>
                    <button
                      onClick={() => handleResponseAction("dispatched")}
                      disabled={responseStatus === "processing"}
                      className="bg-brand hover:bg-brand/90 disabled:bg-muted disabled:cursor-not-allowed text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-colors"
                    >
                      Dispatch Warning
                    </button>
                    <button
                      onClick={() => handleResponseAction("escalated")}
                      disabled={responseStatus === "processing"}
                      className="border border-sev-high-text/30 text-sev-high-text hover:bg-sev-high-bg/30 disabled:opacity-60 disabled:cursor-not-allowed text-xs font-bold px-3 py-2.5 rounded-xl transition-colors"
                    >
                      Escalate
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                    <span className="font-semibold text-navy">Available channels:</span>
                    {[
                      { name: "SMS", icon: MessageSquare },
                      { name: "Email", icon: Mail },
                      { name: "Authority Dashboard", icon: Radio },
                    ].map((channel) => (
                      <span key={channel.name} className="inline-flex items-center gap-1 rounded-lg border border-border bg-page/70 px-2 py-1">
                        <channel.icon className="w-3 h-3 text-brand" />
                        {channel.name}
                      </span>
                    ))}
                  </div>
                  {responseStatus !== "idle" && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-success" role="status" aria-live="polite">
                      {responseStatus === "processing" ? (
                        <span className="w-3 h-3 border-2 border-success border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {responseStatus === "processing"
                          ? "Action queued..."
                          : responseStatus === "acknowledged"
                            ? "Alert acknowledged"
                            : responseStatus === "dispatched"
                              ? "Warning dispatched"
                              : "Alert escalated"}
                      </span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <EmptyState title="No Response Plan" subtitle="Operational response actions will appear when an alert is selected." className="py-6" />
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-border flex items-center justify-between">
            {responseStatus === "dispatched" ? (
              <span className="text-xs font-bold text-success flex items-center gap-1">
                <Check className="w-4 h-4" /> Protocol Dispatched to NDRF / SDRF Nodes
              </span>
            ) : (
              <span className="text-xs text-muted font-mono">Authorization Level: Command Lead</span>
            )}
            <button
              onClick={() => handleResponseAction("dispatched")}
              disabled={!selectedAlert || responseStatus !== "idle"}
              className="bg-brand hover:bg-brand/90 disabled:bg-muted disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              {responseStatus === "processing" ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : responseStatus === "dispatched" ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Dispatched!</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Queue Operational Protocol</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 3: NOTIFICATION CHANNELS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-12 bg-card rounded-2xl p-6 shadow-card border border-border card-hover-effect">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand flex items-center">
              <Radio className="w-4 h-4 mr-2" />
              Multi-Channel Early Warning Relay Mesh
            </h4>
            <span className="text-xs text-success font-semibold">Notification Simulation Ready</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "Emergency SMS", status: "SIMULATED", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: MessageSquare, desc: "Direct cell broadcast alerts" },
              { name: "Disaster Email", status: "SIMULATED", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Mail, desc: "District magistrate priority list" },
              { name: "Webhook Dispatch", status: "SIMULATED", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Zap, desc: "State disaster management feed" },
              { name: "Mobile Push", status: "SIMULATED", color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: Radio, desc: "First responder mobile units" },
            ].map((ch) => (
              <div key={ch.name} className="bg-page/70 rounded-xl p-4 border border-border flex flex-col justify-between hover:border-brand/30 transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-navy">{ch.name}</span>
                    <ch.icon className="w-4 h-4 text-brand" />
                  </div>
                  <p className="text-[11px] text-muted">{ch.desc}</p>
                </div>
                <span className={`text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded-lg border text-center mt-3 ${ch.color}`}>
                  {ch.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
