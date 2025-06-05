# Database Schema - Chess Game Online

## 1. User (User account in game)
- **id**: UUID - string (Primary Key)
- **email**: string (Unique, Not Null)
- **password**: string (Hashed, Not Null)
- **name**: string (Not Null)
- **slogan**: string (Player slogan)
- **avatar**: string (Image URL)
- **avatar_frame**: string (Foreign Key -> avatar_frame.id)
- **background_image**: string (Image URL)
- **rank_point**: number (Default: 0)
- **rank_name**: string (Auto-generated from rank_point)
- **total_game**: number (Default: 0)
- **win_rate**: number (Default: 0)
- **status**: string (online/offline)
- **last_active**: timestamp
- **coin**: number (Game currency, Default: 0)
- **created_at**: timestamp
- **updated_at**: timestamp

## 2. Rooms (Game room)
- **id**: UUID - string (Primary Key)
- **room_code**: string (6 digits, Unique)
- **room_type**: string (public/private, Default: public)
- **status**: string (waiting/queued/in_progress)
- **time_control**: number (Example: "10", "5") // this is a minute for each player to get a move if out of time player lose and player can set this time control.
- **max_spectators**: number (Default: 3)
- **current_spectators**: number (Default: 0)
- **player1_id**: string (Foreign Key -> users.id, Nullable)
- **player2_id**: string (Foreign Key -> users.id, Nullable)

## 3. Games (Game details and results)
- **id**: UUID - string (Primary Key)
- **room_id**: string (Foreign Key -> rooms.id)
- **white_player_id**: string (Foreign Key -> users.id)
- **black_player_id**: string (Foreign Key -> users.id)
- **winner_id**: string (Foreign Key -> users.id, Nullable)
- **move_history**: text (JSON array of moves)
- **game_status**: string (white_win/black_win/draw/in_progress, Default: in_progress)
- **is_ranked**: boolean (Default: true)
- **game_duration**: number (Duration in seconds, Nullable)
- **created_at**: timestamp
- **updated_at**: timestamp

## 4. Room_Spectators (Users watching games)
- **id**: UUID - string (Primary Key)
- **room_id**: string (Foreign Key -> rooms.id)
- **user_id**: string (Foreign Key -> users.id)
- **joined_at**: timestamp
- **left_at**: timestamp (Nullable)

## 5. User_Skins (User customization)
- **id**: UUID - string (Primary Key)
- **user_id**: string (Foreign Key -> users.id, Unique)
- **board_skin**: string (Default: 'classic', Foreign Key -> board_skins.id)
- **piece_skin**: string (Default: 'classic', Foreign Key -> piece_skins.id)
- **created_at**: timestamp
- **updated_at**: timestamp

## 6. Board_Skins (Chess board themes)
- **id**: UUID - string (Primary Key)
- **board_name**: string (Not Null)
- **black_square_url**: string (Image URL)
- **white_square_url**: string (Image URL)
- **obtain**: string (achievement/buy)
- **price**: number (Default: 0)
- **created_at**: timestamp
- **updated_at**: timestamp

## 7. Piece_Skins (Chess piece themes)
- **id**: UUID - string (Primary Key)
- **piece_name**: string (Not Null)
- **black_piece_url**: string (Image URL)
- **white_piece_url**: string (Image URL)
- **obtain**: string (achievement/buy)
- **price**: number (Default: 0)
- **created_at**: timestamp
- **updated_at**: timestamp

## 8. Avatar_Frame (Avatar decorations)
- **id**: UUID - string (Primary Key)
- **name**: string (Not Null)
- **frame_url**: string (Image URL)
- **obtain**: string (achievement/buy)
- **price**: number (Default: 0)
- **created_at**: timestamp
- **updated_at**: timestamp

## 9. Achievements (Game achievements)
- **id**: UUID - string (Primary Key)
- **name**: string (Not Null)
- **description**: string
- **condition_type**: string (wins/rank/games_played)
- **condition_value**: number
- **reward_type**: string (avatar_frame/skin/coins)
- **reward_value**: string (Foreign Key to respective tables)
- **created_at**: timestamp

## 10. User_Achievements (User unlocked achievements)
- **id**: UUID - string (Primary Key)
- **user_id**: string (Foreign Key -> users.id)
- **achievement_id**: string (Foreign Key -> achievements.id)
- **unlocked_at**: timestamp

---

## Rank System
- **0 - 100 points**: Rookie
- **101 - 500 points**: Primary  
- **501 - 1000 points**: Veteran
- **1001 - 2000 points**: Master
- **2001 - 5000 points**: Grandmaster
- **5000+ points**: God I, II, III... (every 5000 points)

## Point System
- **Rookie**: Win +20, Lose +5
- **Primary**: Win +30, Lose +0
- **Veteran**: Win +35, Lose -10
- **Master**: Win +50, Lose -30
- **Grandmaster**: Win +60, Lose -40
- **God I+**: Win +60, Lose -60

## Key Indexes (Recommended)
- `users.email` (Unique)
- `rooms.room_code` (Unique)
- `users.rank_point` (For matchmaking)
- `games.created_at` (For recent games)
- `user_skins.user_id` (One-to-one relationship)