import { IGameState, IPlayer } from "@couch-kit/core";

export interface GameState extends IGameState {
  score: number;
}

export type GameAction =
  | { type: "BUZZ" }
  | { type: "RESET" }
  | {
      type: "PLAYER_JOINED";
      payload: { id: string; name?: string; avatar?: string };
    }
  | { type: "PLAYER_LEFT"; payload: { playerId: string } };

export const initialState: GameState = {
  status: "lobby",
  players: {},
  score: 0,
};

export const gameReducer = (
  state: GameState,
  action: GameAction,
): GameState => {
  switch (action.type) {
    case "BUZZ":
      return { ...state, score: state.score + 1 };
    case "RESET":
      return { ...state, score: 0 };
    case "PLAYER_JOINED": {
      const { id, name, avatar } = action.payload;
      const player: IPlayer = {
        id,
        name: name || `Player ${Object.keys(state.players).length + 1}`,
        avatar,
        isHost: false,
        connected: true,
      };
      return {
        ...state,
        players: { ...state.players, [id]: player },
      };
    }
    case "PLAYER_LEFT": {
      const { playerId } = action.payload;
      const player = state.players[playerId];
      if (!player) return state;
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: { ...player, connected: false },
        },
      };
    }
    default:
      return state;
  }
};
