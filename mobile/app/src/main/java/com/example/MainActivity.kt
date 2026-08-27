package com.example

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.data.model.AppTab
import com.example.data.model.TransactionItem
import com.example.ui.components.AppHeader
import com.example.ui.components.TransactionDetailDialog
import com.example.ui.screens.*
import com.example.ui.theme.*
import com.example.ui.viewmodel.MainViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            MyApplicationTheme {
                MainAppContent(viewModel = viewModel)
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainAppContent(viewModel: MainViewModel) {
    val selectedTab by viewModel.selectedTab.collectAsStateWithLifecycle()
    val profile by viewModel.farmProfile.collectAsStateWithLifecycle()
    val walletDetails by viewModel.walletDetails.collectAsStateWithLifecycle()
    val lastSignedReceipt by viewModel.lastSignedReceipt.collectAsStateWithLifecycle()
    val transactions by viewModel.transactions.collectAsStateWithLifecycle()
    val priceForecast by viewModel.priceForecast.collectAsStateWithLifecycle()
    val yieldForecast by viewModel.yieldForecast.collectAsStateWithLifecycle()
    val bannerMessage by viewModel.bannerMessage.collectAsStateWithLifecycle()
    val ussdState by viewModel.ussdState.collectAsStateWithLifecycle()

    var selectedTransaction by remember { mutableStateOf<TransactionItem?>(null) }
    var showQuickActionSheet by remember { mutableStateOf(false) }

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(bannerMessage) {
        bannerMessage?.let { msg ->
            snackbarHostState.showSnackbar(
                message = msg,
                duration = SnackbarDuration.Short
            )
            viewModel.clearBannerMessage()
        }
    }

    Scaffold(
        modifier = Modifier
            .fillMaxSize()
            .background(GeoBackground)
            .testTag("main_scaffold"),
        containerColor = GeoBackground,
        snackbarHost = {
            SnackbarHost(
                hostState = snackbarHostState,
                snackbar = { data ->
                    Snackbar(
                        modifier = Modifier.padding(16.dp),
                        shape = RoundedCornerShape(16.dp),
                        containerColor = GeoOnSurface,
                        contentColor = Color.White
                    ) {
                        Text(text = data.visuals.message, fontWeight = FontWeight.Medium)
                    }
                }
            )
        },
        topBar = {
            AppHeader(
                farmerName = profile?.farmerName ?: "Mugisha Alain",
                district = profile?.district ?: "Musanze",
                onAvatarClick = { viewModel.selectTab(AppTab.WALLET) },
                onUssdClick = { viewModel.openUssd("*789#") }
            )
        },
        floatingActionButton = {
            if (selectedTab != AppTab.USSD_SIM) {
                FloatingActionButton(
                    onClick = { showQuickActionSheet = true },
                    shape = RoundedCornerShape(18.dp),
                    containerColor = GeoPrimary,
                    contentColor = Color.White,
                    modifier = Modifier
                        .padding(bottom = 16.dp)
                        .testTag("fab_quick_action")
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Quick Action",
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
        },
        bottomBar = {
            GeometricBottomNavigation(
                currentTab = selectedTab,
                onSelectTab = { viewModel.selectTab(it) }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            when (selectedTab) {
                AppTab.DASHBOARD -> DashboardScreen(
                    profile = profile,
                    transactions = transactions,
                    onNavigateTab = { viewModel.selectTab(it) },
                    onOpenSendRemittance = {
                        viewModel.selectTab(AppTab.REMITTANCE)
                    },
                    onOpenProducePayout = {
                        viewModel.selectTab(AppTab.REMITTANCE)
                    },
                    onOpenSavingsConvert = {
                        viewModel.selectTab(AppTab.SAVINGS)
                    },
                    onSelectTransaction = { selectedTransaction = it }
                )

                AppTab.WALLET -> WalletScreen(
                    wallet = walletDetails,
                    lastSignedReceipt = lastSignedReceipt,
                    onCreateDerivedAddress = { viewModel.createDerivedAddress(it) },
                    onConfirmBackup = { viewModel.confirmMnemonicBackup() },
                    onSignMessage = { viewModel.signCustomMessage(it) },
                    onRestoreWallet = { words, callback ->
                        viewModel.restoreWalletFromMnemonic(words, callback)
                    },
                    onRegenerateWallet = { viewModel.regenerateWallet() },
                    onClearSignedReceipt = { viewModel.clearLastSignedReceipt() }
                )

                AppTab.REMITTANCE -> RemittanceScreen(
                    profile = profile,
                    transactions = transactions,
                    onSendRemittance = { name, sats, loc, phone ->
                        viewModel.sendRemittance(name, sats, loc, phone)
                    },
                    onProduceSettlement = { coop, crop, qty, price, phone ->
                        viewModel.processProduceSettlement(coop, crop, qty, price, phone)
                    },
                    onSelectTransaction = { selectedTransaction = it }
                )

                AppTab.SAVINGS -> SavingsScreen(
                    profile = profile,
                    onUpdateSavings = { optIn, pct ->
                        viewModel.toggleSavingsOptIn(optIn, pct)
                    },
                    onConvertSatsToMomo = { sats ->
                        viewModel.convertSatsToMomo(sats)
                    },
                    onConvertMomoToSats = { rwf ->
                        viewModel.convertMomoToSats(rwf)
                    }
                )

                AppTab.AI_PREDICTOR -> AiForecastScreen(
                    profile = profile,
                    priceForecast = priceForecast,
                    yieldForecast = yieldForecast,
                    onRecalculateYield = { crop, district, ares ->
                        viewModel.updateYieldCalculation(crop, district, ares)
                    }
                )

                AppTab.USSD_SIM -> UssdSimulatorScreen(
                    ussdState = ussdState,
                    onSendInput = { viewModel.sendUssdInput(it) },
                    onClose = { viewModel.closeUssd() },
                    onReset = { viewModel.openUssd("*789#") }
                )
            }
        }
    }

    // Detail Dialog
    selectedTransaction?.let { tx ->
        TransactionDetailDialog(
            transaction = tx,
            onDismiss = { selectedTransaction = null }
        )
    }

    // Quick Action Bottom Modal Sheet
    if (showQuickActionSheet) {
        ModalBottomSheet(
            onDismissRequest = { showQuickActionSheet = false },
            sheetState = rememberModalBottomSheetState(),
            containerColor = GeoSurface,
            shape = RoundedCornerShape(topStart = 28.dp, topEnd = 28.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Text(
                    text = "Quick Actions",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    color = GeoOnSurface
                )

                Surface(
                    onClick = {
                        showQuickActionSheet = false
                        viewModel.selectTab(AppTab.REMITTANCE)
                    },
                    shape = RoundedCornerShape(16.dp),
                    color = GeoPrimaryContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Bolt, contentDescription = null, tint = GeoOnPrimaryContainer)
                        Column {
                            Text(text = "Lightning Remittance", fontWeight = FontWeight.Bold, color = GeoOnPrimaryContainer)
                            Text(text = "Send or receive BTC -> Instant MoMo", style = MaterialTheme.typography.labelSmall, color = GeoOnPrimaryContainer.copy(alpha = 0.8f))
                        }
                    }
                }

                Surface(
                    onClick = {
                        showQuickActionSheet = false
                        viewModel.selectTab(AppTab.REMITTANCE)
                    },
                    shape = RoundedCornerShape(16.dp),
                    color = GeoSecondaryContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Agriculture, contentDescription = null, tint = GeoOnSecondaryContainer)
                        Column {
                            Text(text = "Produce & Crop Payout", fontWeight = FontWeight.Bold, color = GeoOnSecondaryContainer)
                            Text(text = "Settle harvest with cooperative", style = MaterialTheme.typography.labelSmall, color = GeoOnSecondaryContainer.copy(alpha = 0.8f))
                        }
                    }
                }

                Surface(
                    onClick = {
                        showQuickActionSheet = false
                        viewModel.openUssd("*789#")
                        viewModel.selectTab(AppTab.USSD_SIM)
                    },
                    shape = RoundedCornerShape(16.dp),
                    color = GeoTertiaryContainer,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(imageVector = Icons.Default.Phone, contentDescription = null, tint = GeoOnTertiaryContainer)
                        Column {
                            Text(text = "Launch Feature Phone USSD", fontWeight = FontWeight.Bold, color = GeoOnTertiaryContainer)
                            Text(text = "Simulate *789# USSD menu for rural farmers", style = MaterialTheme.typography.labelSmall, color = GeoOnTertiaryContainer.copy(alpha = 0.8f))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }
}

@Composable
fun GeometricBottomNavigation(
    currentTab: AppTab,
    onSelectTab: (AppTab) -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .height(76.dp)
            .testTag("bottom_nav_bar"),
        color = GeoBackground,
        border = CardDefaults.outlinedCardBorder().copy(
            brush = androidx.compose.ui.graphics.SolidColor(GeoOutline.copy(alpha = 0.4f))
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            AppTab.values().forEach { tab ->
                val selected = currentTab == tab
                val icon = when (tab) {
                    AppTab.DASHBOARD -> Icons.Default.Home
                    AppTab.WALLET -> Icons.Default.AccountBalanceWallet
                    AppTab.REMITTANCE -> Icons.Default.CurrencyExchange
                    AppTab.SAVINGS -> Icons.Default.Savings
                    AppTab.AI_PREDICTOR -> Icons.Default.AutoGraph
                    AppTab.USSD_SIM -> Icons.Default.Dialpad
                }

                Column(
                    modifier = Modifier
                        .clip(RoundedCornerShape(16.dp))
                        .clickable { onSelectTab(tab) }
                        .padding(horizontal = 10.dp, vertical = 6.dp)
                        .testTag("nav_tab_${tab.name.lowercase()}"),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(20.dp))
                            .background(if (selected) GeoPrimaryContainer else Color.Transparent)
                            .padding(horizontal = 14.dp, vertical = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = tab.label,
                            tint = if (selected) GeoOnPrimaryContainer else GeoOnSurfaceVariant,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = tab.label,
                        style = MaterialTheme.typography.labelSmall,
                        fontSize = 10.sp,
                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                        color = if (selected) GeoOnPrimaryContainer else GeoOnSurfaceVariant
                    )
                }
            }
        }
    }
}
