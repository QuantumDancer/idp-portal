/**
 * OpenTelemetry SDK bootstrap — must be imported before any other module so
 * auto-instrumentations can patch Node.js built-ins and third-party libraries
 * at require-time.
 *
 * Traces and metrics are both exported over OTLP/gRPC to the same endpoint.
 *
 * Initialization is skipped when OTEL_EXPORTER_OTLP_ENDPOINT is unset, so
 * local dev is unaffected by default.
 *
 * In production, set:
 *   OTEL_EXPORTER_OTLP_ENDPOINT=http://k8s-monitoring-alloy-receiver.k8s-monitoring.svc.cluster.local:4317
 *   OTEL_SERVICE_NAME=backstage
 */

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

// Surface exporter failures (wrong hostname, connection refused, etc.) in pod
// logs instead of silently dropping spans.
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (endpoint) {
  const sdk = new NodeSDK({
    // Endpoint and service name are read from OTEL_EXPORTER_OTLP_ENDPOINT
    // and OTEL_SERVICE_NAME env vars automatically.
    traceExporter: new OTLPTraceExporter(),
    // Pin metrics to gRPC explicitly. Without a reader, NodeSDK auto-configures
    // one that defaults to OTLP/HTTP, which then fails against the gRPC-only
    // receiver port (4317) with a "Expected HTTP/" parse error.
    metricReader: new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter(),
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // File system instrumentation is too noisy for this use-case.
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  // Flush pending spans before the process exits.
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .catch(err => console.error('OTel SDK shutdown error', err))
      .finally(() => process.exit(0));
  });
}
