package com.example.data.db

import android.content.Context
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.Update
import com.example.data.model.FarmProfile
import com.example.data.model.TransactionItem
import kotlinx.coroutines.flow.Flow

@Dao
interface TransactionDao {
    @Query("SELECT * FROM transactions ORDER BY timestamp DESC")
    fun getAllTransactions(): Flow<List<TransactionItem>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTransaction(transaction: TransactionItem): Long

    @Query("SELECT COUNT(*) FROM transactions")
    suspend fun countTransactions(): Int
}

@Dao
interface FarmProfileDao {
    @Query("SELECT * FROM farm_profile WHERE id = 1 LIMIT 1")
    fun getProfile(): Flow<FarmProfile?>

    @Query("SELECT * FROM farm_profile WHERE id = 1 LIMIT 1")
    suspend fun getProfileSync(): FarmProfile?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProfile(profile: FarmProfile)

    @Update
    suspend fun updateProfile(profile: FarmProfile)
}

@Database(entities = [TransactionItem::class, FarmProfile::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun transactionDao(): TransactionDao
    abstract fun farmProfileDao(): FarmProfileDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "bitcoin_for_farmers.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
