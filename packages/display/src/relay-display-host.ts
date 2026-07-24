/**
 * Vendored from the couch-kit reference `examples/relay-display`. This will move
 * into a `@couch-kit/display` package; until then it's copied here so the browser
 * display can own the authoritative runtime and bridge it to the relay.
 *
 * Depends only on published packages: @couch-kit/runtime, @couch-kit/core,
 * @couch-kit/client (relay protocol).
 */
import {
  GameHostRuntime,
  frameByteLength,
  DEFAULT_MAX_MESSAGE_BYTES,
  type GameHostRuntimeConfig,
  type GameRuntimeTransport,
} from "@couch-kit/runtime";
import type { IGameState, IAction, HostMessage } from "@couch-kit/core";
import { RelayMessageTypes, type RelayServerMessage } from "@couch-kit/client";

export interface RelayDisplayHostOptions<S extends IGameState, A extends IAction>
  extends GameHostRuntimeConfig<S, A> {
  /** WebSocket URL of the shared relay server. */
  url: string;
  /** Room code phones will use to reach this display. */
  roomId: string;
}

/**
 * Browser display host: owns a {@link GameHostRuntime} and bridges it to a
 * game-agnostic relay. Maps relay peer lifecycle + data to the runtime, and
 * implements {@link GameRuntimeTransport} over relay `DATA` envelopes.
 */
export class RelayDisplayHost<S extends IGameState, A extends IAction> {
  private readonly runtime: GameHostRuntime<S, A>;
  private readonly ws: WebSocket;
  private readonly roomId: string;
  private readonly peers = new Set<string>();

  constructor(options: RelayDisplayHostOptions<S, A>) {
    const { url, roomId, ...runtimeConfig } = options;
    this.roomId = roomId;
    this.runtime = new GameHostRuntime<S, A>(runtimeConfig);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.ws.send(
        JSON.stringify({
          type: RelayMessageTypes.CREATE_ROOM,
          roomId: this.roomId,
        }),
      );
    };

    this.ws.onmessage = (event: MessageEvent) => {
      let msg: RelayServerMessage;
      try {
        msg = JSON.parse(event.data as string) as RelayServerMessage;
      } catch {
        return;
      }
      this.handleRelayMessage(msg);
    };

    this.ws.onerror = (event) =>
      this.runtime.handleError(
        event instanceof Error ? event : new Error("Relay socket error"),
      );

    const transport: GameRuntimeTransport = {
      send: (connectionId, message) => this.sendEnvelope(message, connectionId),
      broadcast: (message) => this.sendEnvelope(message),
    };
    this.runtime.setTransport(transport);
  }

  getState = (): S => this.runtime.getState();

  subscribe = (listener: () => void): (() => void) =>
    this.runtime.subscribe(listener);

  dispatch = (action: A): void => this.runtime.dispatch(action);

  stop(): void {
    this.runtime.setTransport(null);
    this.runtime.stop();
    this.ws.close();
  }

  private sendEnvelope(message: HostMessage, to?: string): void {
    const envelope: Record<string, unknown> = {
      type: RelayMessageTypes.DATA,
      roomId: this.roomId,
      data: JSON.stringify(message),
    };
    if (to !== undefined) envelope.to = to;
    this.ws.send(JSON.stringify(envelope));
  }

  private handleRelayMessage(msg: RelayServerMessage): void {
    switch (msg.type) {
      case RelayMessageTypes.PEER_JOINED:
        this.peers.add(msg.peerId);
        this.runtime.handleConnection(msg.peerId);
        break;
      case RelayMessageTypes.PEER_LEFT:
        this.peers.delete(msg.peerId);
        this.runtime.handleDisconnect(msg.peerId);
        break;
      case RelayMessageTypes.DATA: {
        if (!msg.from) break;
        if (frameByteLength(msg.data) > DEFAULT_MAX_MESSAGE_BYTES) break;
        let parsed: unknown;
        try {
          parsed = JSON.parse(msg.data);
        } catch {
          break;
        }
        this.runtime
          .handleMessage(msg.from, parsed)
          .catch((err) =>
            this.runtime.handleError(
              err instanceof Error ? err : new Error(String(err)),
            ),
          );
        break;
      }
      case RelayMessageTypes.ERROR:
        this.runtime.handleError(new Error(msg.message));
        break;
    }
  }
}
