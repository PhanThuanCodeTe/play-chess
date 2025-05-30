# 1. User (User account in game)
- ID:  UUID - string
- Email: string
- Password: string hashed
- Name: name - string
- Slogan: player slogan -string
- Avatar: image_url - string
- Avatar_Frame: frame for avatar - string (foreign key -> avatarframe.id)
- Background_Image: string
- Rank_point: number (0 default)
- Rank_name: created automatically by Rank_point - string
- Total_game: number (0 default)
- Win_rate: win rate - number
- Status: status (online/offline)
- Last_active: time
- coin: number - this is this game currency
- CreatedAt: timestamp
- UpdatedAt: timestamp

# 2. Room (Room in game)
- id: UUID - string
- room_code: 6 number unique - string
- room_type: string - public or private (default:public) - just a line here we will not do anything about this now
status: string, waiting, queued
max_spectators: number (default: 3)
current_spectators: number (default: 0)
player1_id: string (foreign key -> users.id)
player2_id: string (foreign key -> users.id)
created_at: timestamp
updated_at: timestamp

# 3. Games (Game details)
- id: UUID - string
- room_id: string
- white_player_id: string (foreign key -> users.id)
- black_player_id: string (foreign key -> users.id)
- move_history: text, -- JSON array save player move (maybe for ai to learn later)
- game_status: string - white win, black win, draw, in progress (default when create)
created_at: timestamp
updated_at: timestamp

# 4. Room_Spectators
- id: UUID - string
- room_id: string (foreign key -> rooms.id)
- user_id: string (foreign key -> users.id)
- joined_at: timestamp
- left_at: timestamp

# 5. User_Skins (user custom skin)
- id: UUID - string
- user_id: string (foreign key -> users.id)
- board_skin: string (default: 'classic', foreign key -> boardskins.id)
- piece_skin: string (default: 'classic', foreign key -> pieceskins.id)
- created_at: timestamp
- updated_at: timestamp

# 6. Board_Skins (skin for board)
- id: UUID - string
- board_name: string 
- black_quare_url: string
- white_square_url: string
- obtain: string (achievement - buy)
- price: number (default: 0)
- created_at: timestamp
- updated_at: timestamp

# 7. Piece_Skins (skin for board)
- id: UUID - string
- piece_name: string 
- black_piece_url: string
- white_piece_url: string
- obtain: string (achievement - buy)
- price: number (default: 0)
- created_at: timestamp
- updated_at: timestamp

# 7. Avatar_frame (skin for board)
- id: UUID - string
- name: string 
- frame_url: string
- obtain: string (achievement - buy)
- price: number (default: 0)
- created_at: timestamp
- updated_at: timestamp

# 9. Achievements
- id: UUID - string
- name: string
- description: string
- condition_type: string, -- 'wins', 'rank', 'games_played'
- condition_value: number,
- reward_type: string, (avatar_frame, skin)
- reward_value: string, (fogeinkey -> boardskins.id, pieceskins.id, avatarframe.id)
- created_at: timestamp

# 10. User_Achievements 
- id: UUID - string
- user_id: string (foreign key -> users.id)
- achievement_id: string (foreign key -> achievements.id)
- unlocked_at: timestamp