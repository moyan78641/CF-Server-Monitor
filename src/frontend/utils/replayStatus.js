import { normalizeTimestamp } from './time.js'

// A sample's collection time belongs to its chart; the report's arrival time
// determines whether the node is online, even while cached samples replay.
export const buildReplayStatusData = (event) => {
  const sampleTs = normalizeTimestamp(event?.ts ?? event?.data?.sample_timestamp ?? event?.data?.last_updated)
  const reportTs = normalizeTimestamp(event?.reportTs ?? event?.data?.report_timestamp ?? event?.data?.last_updated, sampleTs)
  return {
    ...event?.data,
    sample_timestamp: sampleTs,
    report_timestamp: reportTs,
    last_updated: reportTs,
  }
}
