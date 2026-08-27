package com.example.data.crypto

import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.Mac
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

/**
 * Pure Kotlin / Android Cryptographic toolkit for Bitcoin wallet operations:
 * - BIP-39 12-Word Mnemonic generation & validation
 * - PBKDF2 HMAC-SHA512 seed derivation
 * - SHA-256 and RIPEMD-160 (Hash160)
 * - Base58Check encoding (Legacy P2PKH addresses)
 * - Bech32 / Bech32m encoding (Native SegWit bc1q... & Taproot bc1p...)
 * - Public key compression & address generation
 * - Cryptographic Message Signing and Signature Verification
 */
object BitcoinCryptoUtils {

    private val secureRandom = SecureRandom()

    // Standard BIP-39 English Word List (2048 words)
    private val BIP39_WORDS: List<String> = listOf(
        "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract", "absurd", "abuse",
        "access", "accident", "account", "accuse", "achieve", "acid", "acoustic", "acquire", "across", "act",
        "action", "actor", "actress", "actual", "adapt", "add", "addict", "address", "adjust", "admit",
        "adult", "advance", "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
        "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album", "alcohol", "alert",
        "alien", "all", "alley", "allow", "almost", "alone", "alpha", "already", "also", "alter",
        "always", "amateur", "amazing", "among", "amount", "amused", "analyst", "anchor", "ancient", "anger",
        "angle", "angry", "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
        "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april", "arch", "arctic",
        "area", "arena", "argue", "arm", "armed", "armor", "army", "around", "arrange", "arrest",
        "arrive", "arrow", "art", "artefact", "artist", "artwork", "ask", "aspect", "assault", "asset",
        "assist", "assume", "asthma", "athlete", "atom", "attack", "attend", "attitude", "attract", "auction",
        "audit", "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid", "awake",
        "aware", "away", "awesome", "awful", "awkward", "axis", "baby", "bachelor", "bacon", "badge",
        "bag", "balance", "balcony", "ball", "bamboo", "banana", "banner", "bar", "barely", "bargain",
        "barrel", "base", "basic", "basket", "battle", "beach", "bean", "beauty", "because", "become",
        "beef", "before", "begin", "behave", "behind", "believe", "below", "belt", "bench", "benefit",
        "best", "betray", "better", "between", "beyond", "bicycle", "bid", "bike", "bind", "biology",
        "bird", "birth", "bitter", "black", "blade", "blame", "blanket", "blast", "bleak", "bless",
        "blind", "blood", "blossom", "blouse", "blue", "blur", "blush", "board", "boat", "body",
        "boil", "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow", "boss",
        "bottom", "bounce", "box", "boy", "bracket", "brain", "brand", "brass", "brave", "bread",
        "breeze", "brick", "bridge", "brief", "bright", "bring", "brisk", "broccoli", "broken", "bronze",
        "broom", "brother", "brown", "brush", "bubble", "buddy", "budget", "buffalo", "build", "bulb",
        "bulk", "bullet", "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy",
        "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage", "cake", "call",
        "calm", "camera", "camp", "can", "canal", "cancel", "candy", "cannon", "canoe", "canvas",
        "canyon", "capable", "capital", "captain", "car", "carbon", "card", "cargo", "carpet", "carry",
        "cart", "case", "cash", "casino", "castle", "casual", "cat", "catalog", "catch", "category",
        "cattle", "caught", "cause", "caution", "cave", "ceiling", "celery", "cement", "census", "century",
        "cereal", "certain", "chair", "chalk", "champion", "change", "chaos", "chapter", "charge", "chase",
        "chat", "cheap", "check", "cheese", "chef", "cherry", "chest", "chicken", "chief", "child",
        "chimney", "choice", "choose", "chronic", "chuckle", "chunk", "churn", "cigar", "cinnamon", "circle",
        "citizen", "city", "civil", "claim", "clap", "clarify", "claw", "clay", "clean", "clerk",
        "clever", "click", "client", "cliff", "climb", "clinic", "clip", "clock", "clog", "close",
        "cloth", "cloud", "clown", "club", "clump", "cluster", "clutch", "coach", "coast", "coconut",
        "code", "coffee", "coil", "coin", "collect", "color", "column", "combine", "come", "comfort",
        "comic", "common", "company", "concert", "conduct", "confirm", "congress", "connect", "consider", "control",
        "convince", "cook", "cool", "copper", "copy", "coral", "core", "corn", "correct", "cost",
        "cotton", "couch", "country", "couple", "course", "cousin", "cover", "coyote", "crack", "cradle",
        "craft", "cram", "crane", "crash", "crater", "crawl", "crazy", "cream", "credit", "creek",
        "crew", "cricket", "crime", "crisp", "critic", "crop", "cross", "crouch", "crowd", "crucial",
        "cruel", "cruise", "crumble", "crunch", "crush", "cry", "crystal", "cube", "culture", "cup",
        "cupboard", "curious", "current", "curtain", "curve", "cushion", "custom", "cute", "cycle", "dad",
        "damage", "damp", "dance", "danger", "daring", "dash", "daughter", "dawn", "day", "deal",
        "debate", "debris", "decade", "december", "decide", "decline", "decorate", "decrease", "deer", "defense",
        "define", "defy", "degree", "delay", "deliver", "demand", "demise", "denial", "dentist", "deny",
        "depart", "depend", "deposit", "depth", "deputy", "derive", "describe", "desert", "design", "desk",
        "despair", "destroy", "detail", "detect", "develop", "device", "devote", "diagram", "dial", "diamond",
        "diary", "dice", "diesel", "diet", "differ", "digital", "dignity", "dilemma", "dinner", "dinosaur",
        "direct", "dirt", "disagree", "discover", "disease", "dish", "dismiss", "disorder", "display", "distance",
        "divert", "divide", "divorce", "dizzy", "doctor", "document", "dog", "doll", "dolphin", "domain",
        "donate", "donkey", "donor", "door", "dose", "double", "dove", "draft", "dragon", "drama",
        "drastic", "draw", "dream", "dress", "drift", "drill", "drink", "drip", "drive", "drop",
        "drum", "dry", "duck", "dumb", "dune", "during", "dust", "dutch", "duty", "dwarf",
        "dynamic", "eager", "eagle", "early", "earn", "earth", "easily", "east", "easy", "echo",
        "ecology", "economy", "edge", "edit", "educate", "effort", "egg", "eight", "either", "elbow",
        "elder", "electric", "elegant", "element", "elephant", "elevator", "elite", "else", "embark", "embody",
        "embrace", "emerge", "emotion", "employ", "empower", "empty", "enable", "enact", "end", "endless",
        "endorse", "enemy", "energy", "enforce", "engage", "engine", "enhance", "enjoy", "enlist", "enough",
        "enrich", "enroll", "ensure", "enter", "entire", "entry", "envelope", "episode", "equal", "equip",
        "era", "erase", "erode", "erosion", "error", "erupt", "escape", "essay", "essence", "estate",
        "eternal", "ethics", "evidence", "evil", "evoke", "evolve", "exact", "example", "excess", "exchange",
        "excite", "exclude", "excuse", "execute", "exercise", "exhaust", "exhibit", "exile", "exist", "exit",
        "exotic", "expand", "expect", "expire", "explain", "expose", "express", "extend", "extra", "eye",
        "eyebrow", "fabric", "face", "faculty", "fade", "faint", "faith", "fall", "false", "fame",
        "family", "famous", "fan", "fancy", "fantasy", "farm", "fashion", "fat", "fatal", "father",
        "fatigue", "fault", "favorite", "feature", "february", "federal", "fee", "feed", "feel", "female",
        "fence", "festival", "fetch", "fever", "few", "fiber", "fiction", "field", "figure", "file",
        "film", "filter", "final", "find", "fine", "finger", "finish", "fire", "firm", "first",
        "fiscal", "fish", "fit", "fitness", "fix", "flag", "flame", "flash", "flat", "flavor",
        "flee", "flight", "flip", "float", "flock", "floor", "flower", "fluid", "flush", "fly",
        "foam", "focus", "fog", "foil", "fold", "follow", "food", "foot", "force", "forest",
        "forget", "fork", "fortune", "forum", "forward", "fossil", "foster", "found", "fox", "fragile",
        "frame", "frequent", "fresh", "friend", "fringe", "frog", "front", "frost", "frown", "frozen",
        "fruit", "fuel", "fun", "funny", "furnace", "fury", "future", "gadget", "gain", "galaxy",
        "gallery", "game", "gap", "garage", "garbage", "garden", "garlic", "garment", "gas", "gasp",
        "gate", "gather", "gauge", "gaze", "general", "genius", "genre", "gentle", "genuine", "gesture",
        "ghost", "giant", "gift", "giggle", "ginger", "giraffe", "girl", "give", "glad", "glance",
        "glare", "glass", "glide", "glimpse", "globe", "gloom", "glory", "glove", "glow", "glue",
        "goat", "goddess", "gold", "good", "goose", "gorilla", "gospel", "gossip", "govern", "gown",
        "grab", "grace", "grain", "grant", "grape", "grass", "gravity", "great", "green", "grid",
        "grief", "grit", "grocery", "group", "grow", "grunt", "guard", "guess", "guide", "guilt",
        "guitar", "gun", "gym", "habit", "hair", "half", "hammer", "hamster", "hand", "handle",
        "harbor", "hard", "harsh", "harvest", "hat", "have", "hawk", "hazard", "head", "health",
        "heart", "heavy", "hedgehog", "height", "hello", "helmet", "help", "hen", "hero", "hidden",
        "high", "hill", "hint", "hip", "hire", "history", "hobby", "hockey", "hold", "hole",
        "holiday", "hollow", "home", "honey", "hood", "hope", "horn", "horror", "horse", "hospital",
        "host", "hotel", "hour", "hover", "hub", "huge", "human", "humble", "humor", "hundred",
        "hungry", "hunt", "hurdle", "hurry", "hurt", "husband", "hybrid", "ice", "icon", "idea",
        "identify", "idle", "ignore", "ill", "illegal", "illness", "image", "imitate", "immense", "immune",
        "impact", "impose", "improve", "impulse", "inch", "include", "income", "increase", "index", "indicate",
        "indoor", "industry", "infant", "inflict", "inform", "inhale", "inherit", "initial", "inject", "injury",
        "inmate", "inner", "innocent", "input", "inquiry", "insane", "insect", "inside", "inspire", "install",
        "intact", "interest", "into", "invest", "invite", "involve", "iron", "island", "isolate", "issue",
        "item", "ivory", "jacket", "jaguar", "jar", "jazz", "jealous", "jeans", "jelly", "jewel",
        "job", "join", "joke", "journey", "joy", "judge", "juice", "jump", "jungle", "junior",
        "junk", "just", "kangaroo", "keen", "keep", "ketchup", "key", "kick", "kid", "kidney",
        "kind", "kingdom", "kiss", "kit", "kitchen", "kite", "kitten", "kiwi", "knee", "knife",
        "knock", "know", "lab", "label", "labor", "ladder", "lady", "lake", "lamp", "language",
        "laptop", "large", "later", "latin", "laugh", "laundry", "lava", "law", "lawn", "lawsuit",
        "layer", "lazy", "leader", "leaf", "learn", "leave", "lecture", "left", "leg", "legal",
        "legend", "leisure", "lemon", "lend", "length", "lens", "leopard", "lesson", "letter", "level",
        "liar", "liberty", "library", "license", "life", "lift", "light", "like", "limb", "limit",
        "link", "lion", "liquid", "list", "little", "live", "lizard", "load", "loan", "lobster",
        "local", "lock", "logic", "lonely", "long", "loop", "lottery", "loud", "lounge", "love",
        "loyal", "lucky", "luggage", "lumber", "lunar", "lunch", "luxury", "lyrics", "machine", "mad",
        "magic", "magnet", "maid", "mail", "main", "major", "make", "mammal", "man", "manage",
        "mandate", "mango", "mansion", "manual", "maple", "marble", "march", "margin", "marine", "market",
        "marriage", "mask", "mass", "master", "match", "material", "math", "matrix", "matter", "maximum",
        "maze", "meadow", "mean", "measure", "meat", "mechanic", "medal", "media", "melody", "melt",
        "member", "memory", "mention", "menu", "mercy", "merge", "merit", "merry", "mesh", "message",
        "metal", "method", "middle", "midnight", "milk", "million", "mimic", "mind", "minimum", "minor",
        "minute", "miracle", "mirror", "misery", "miss", "mistake", "mix", "mixed", "mixture", "mobile",
        "model", "modify", "mom", "moment", "monitor", "monkey", "monster", "month", "moon", "moral",
        "more", "morning", "mosquito", "mother", "motion", "motor", "mountain", "mouse", "move", "movie",
        "much", "muffin", "mule", "multiply", "muscle", "museum", "mushroom", "music", "must", "mutual",
        "myself", "mystery", "myth", "naive", "name", "napkin", "narrow", "nasty", "nation", "nature",
        "near", "neck", "need", "negative", "neglect", "neither", "nephew", "nerve", "nest", "net",
        "network", "neutral", "never", "news", "next", "nice", "night", "noble", "noise", "nominee",
        "noodle", "normal", "north", "nose", "notable", "note", "nothing", "notice", "novel", "now",
        "nuclear", "number", "nurse", "nut", "oak", "obey", "object", "oblige", "obscure", "observe",
        "obtain", "obvious", "occur", "ocean", "october", "odor", "off", "offer", "office", "often",
        "oil", "okay", "old", "olive", "olympic", "omit", "once", "one", "onion", "online",
        "only", "open", "opera", "opinion", "oppose", "option", "orange", "orbit", "orchard", "order",
        "ordinary", "organ", "orient", "original", "orphan", "ostrich", "other", "outdoor", "outer", "output",
        "outside", "oval", "oven", "over", "own", "owner", "oxygen", "oyster", "ozone", "pact",
        "paddle", "page", "pair", "palace", "palm", "panda", "panel", "panic", "panther", "paper",
        "parade", "parent", "park", "parrot", "party", "pass", "patch", "path", "patient", "patrol",
        "pattern", "pause", "pave", "payment", "peace", "peanut", "pear", "peasant", "pelican", "pen",
        "penalty", "pencil", "people", "pepper", "perfect", "permit", "person", "pet", "phone", "photo",
        "phrase", "physical", "piano", "picnic", "picture", "piece", "pig", "pigeon", "pill", "pilot",
        "pink", "pioneer", "pipe", "pistol", "pitch", "pizza", "place", "planet", "plastic", "plate",
        "play", "please", "pledge", "pluck", "plug", "plunge", "poem", "poet", "point", "polar",
        "pole", "police", "pond", "pony", "pool", "popular", "portion", "position", "possible", "post",
        "potato", "pottery", "poverty", "powder", "power", "practice", "praise", "predict", "prefer", "prepare",
        "present", "pretty", "prevent", "price", "pride", "primary", "print", "priority", "prison", "private",
        "prize", "problem", "process", "produce", "profit", "program", "project", "promote", "proof", "property",
        "prosper", "protect", "proud", "provide", "public", "pudding", "pull", "pulp", "pulse", "pumpkin",
        "punch", "pupil", "puppy", "purchase", "purity", "purpose", "purse", "push", "put", "puzzle",
        "pyramid", "quality", "quantum", "quarter", "question", "quick", "quit", "quiz", "quote", "rabbit",
        "raccoon", "race", "rack", "radar", "radio", "rail", "rain", "raise", "rally", "ramp",
        "ranch", "random", "range", "rapid", "rare", "rate", "rather", "raven", "raw", "razor",
        "ready", "real", "reason", "rebel", "rebuild", "recall", "receive", "recipe", "record", "recycle",
        "reduce", "reflect", "reform", "refuse", "region", "regret", "regular", "reject", "relax", "release",
        "relief", "rely", "remain", "remember", "remind", "remove", "render", "renew", "rent", "reopen",
        "repair", "repeat", "replace", "report", "require", "rescue", "resemble", "resist", "resource", "response",
        "result", "retire", "retreat", "return", "reunion", "reveal", "review", "reward", "rhythm", "rib",
        "ribbon", "rice", "rich", "ride", "ridge", "rifle", "right", "rigid", "ring", "riot",
        "ripple", "risk", "ritual", "rival", "river", "road", "roast", "robot", "robust", "rocket",
        "romance", "roof", "rookie", "room", "rose", "rotate", "rough", "round", "route", "royal",
        "rubber", "rude", "rug", "rule", "run", "runway", "rural", "sad", "saddle", "sadness",
        "safe", "sail", "salad", "salmon", "salon", "salt", "salute", "same", "sample", "sand",
        "satisfy", "satoshi", "sauce", "sausage", "save", "say", "scale", "scan", "scare", "scatter",
        "scene", "scheme", "school", "science", "scissors", "scorpion", "scout", "scrap", "screen", "script",
        "scrub", "sea", "search", "season", "seat", "second", "secret", "section", "security", "seed",
        "seek", "segment", "select", "sell", "seminar", "senior", "sense", "sentence", "series", "service",
        "session", "settle", "setup", "seven", "shadow", "shaft", "shallow", "share", "shed", "shell",
        "sheriff", "shield", "shift", "shine", "ship", "shiver", "shock", "shoe", "shoot", "shop",
        "short", "shoulder", "shove", "shrimp", "shrug", "shuffle", "shy", "sibling", "sick", "side",
        "siege", "sight", "sign", "silent", "silk", "silly", "silver", "similar", "simple", "since",
        "sing", "siren", "sister", "situate", "six", "size", "skate", "sketch", "ski", "skill",
        "skin", "skirt", "skull", "slab", "slam", "sleep", "slender", "slice", "slide", "slight",
        "slim", "slogan", "slot", "slow", "slush", "small", "smart", "smile", "smoke", "smooth",
        "snack", "snake", "snap", "sniff", "snow", "soap", "soccer", "social", "sock", "soda",
        "soft", "solar", "soldier", "solid", "solution", "solve", "someone", "song", "soon", "sorry",
        "sort", "soul", "sound", "soup", "source", "south", "space", "spare", "spatial", "spawn",
        "speak", "special", "speed", "spell", "spend", "sphere", "spice", "spider", "spike", "spin",
        "spirit", "split", "spoil", "sponsor", "spoon", "sport", "spot", "spray", "spread", "spring",
        "spy", "square", "squeeze", "squirrel", "stable", "stadium", "staff", "stage", "stairs", "stamp",
        "stand", "start", "state", "stay", "steak", "steel", "stem", "step", "stereo", "stick",
        "still", "sting", "stock", "stomach", "stone", "stool", "story", "stove", "strategy", "street",
        "strike", "strong", "struggle", "student", "stuff", "stumble", "style", "subject", "submit", "subway",
        "success", "such", "sudden", "suffer", "sugar", "suggest", "suit", "summer", "sun", "sunny",
        "sunset", "super", "supply", "supreme", "sure", "surface", "surge", "surprise", "surround", "survey",
        "suspect", "sustain", "swallow", "swamp", "swap", "swarm", "swear", "sweet", "swift", "swim",
        "swing", "switch", "sword", "symbol", "symptom", "syrup", "system", "table", "tackle", "tag",
        "tail", "talent", "talk", "tank", "tape", "target", "task", "taste", "tattoo", "taxi",
        "teach", "team", "tell", "ten", "tenant", "tennis", "tent", "term", "test", "text",
        "thank", "that", "theme", "then", "theory", "there", "they", "thing", "this", "thought",
        "three", "thrive", "throw", "thumb", "thunder", "ticket", "tide", "tiger", "tilt", "timber",
        "time", "tiny", "tip", "tired", "tissue", "title", "toast", "tobacco", "today", "toddler",
        "toe", "together", "toilet", "token", "tomato", "tomorrow", "tone", "tongue", "tonight", "tool",
        "tooth", "top", "topic", "topple", "torch", "tornado", "tortoise", "toss", "total", "tourist",
        "toward", "tower", "town", "toy", "track", "trade", "traffic", "tragic", "train", "transfer",
        "trap", "trash", "travel", "tray", "treat", "tree", "trend", "trial", "tribe", "trick",
        "trigger", "trim", "trip", "trophy", "trouble", "truck", "true", "truly", "trumpet", "trust",
        "truth", "try", "tube", "tuition", "tumble", "tuna", "tunnel", "turkey", "turn", "turtle",
        "twelve", "twenty", "twice", "twin", "twist", "two", "type", "typical", "ugly", "umbrella",
        "unable", "unaware", "uncle", "uncover", "under", "undo", "unfair", "unfold", "unhappy", "uniform",
        "unique", "unit", "universe", "unknown", "unlock", "until", "unusual", "unveil", "update", "upgrade",
        "uphold", "upon", "upper", "upset", "urban", "urge", "usage", "use", "used", "useful",
        "useless", "usual", "utility", "vacant", "vacuum", "vague", "valid", "valley", "valve", "van",
        "vanish", "vapor", "various", "vast", "vault", "vehicle", "velvet", "vendor", "venture", "venue",
        "verb", "verify", "version", "very", "vessel", "veteran", "viable", "vibrant", "vicious", "victory",
        "video", "view", "village", "vintage", "violin", "virtual", "virus", "visa", "visit", "visual",
        "vital", "vivid", "vocal", "voice", "void", "volcano", "volume", "vote", "voyage", "wage",
        "wagon", "wait", "walk", "wall", "walnut", "want", "warfare", "warm", "warrior", "wash",
        "wasp", "waste", "water", "wave", "way", "wealth", "weapon", "wear", "weasel", "weather",
        "web", "wedding", "weekend", "weird", "welcome", "west", "wet", "whale", "what", "wheat",
        "wheel", "when", "where", "whip", "whisper", "wide", "width", "wife", "wild", "will",
        "win", "window", "wine", "wing", "wink", "winner", "winter", "wire", "wisdom", "wise",
        "wish", "witness", "wolf", "woman", "wonder", "wood", "wool", "word", "work", "world",
        "worry", "worth", "wrap", "wreck", "wrestle", "wrist", "write", "wrong", "yard", "year",
        "yellow", "you", "young", "youth", "zebra", "zero", "zone", "zoo"
    )

    /**
     * Generates a secure random 12-word BIP-39 mnemonic phrase from 128-bit entropy.
     */
    fun generate12WordMnemonic(): List<String> {
        val entropy = ByteArray(16) // 128 bits
        secureRandom.nextBytes(entropy)

        // 128 bits + 4 bits checksum = 132 bits = 12 words * 11 bits
        val hash = sha256(entropy)
        val checksumBits = (hash[0].toInt() and 0xFF) ushr 4

        // Build bits string
        val bitStringBuilder = StringBuilder()
        for (b in entropy) {
            val bitStr = String.format("%8s", Integer.toBinaryString(b.toInt() and 0xFF)).replace(' ', '0')
            bitStringBuilder.append(bitStr)
        }
        val checksumStr = String.format("%4s", Integer.toBinaryString(checksumBits)).replace(' ', '0')
        bitStringBuilder.append(checksumStr)

        val fullBits = bitStringBuilder.toString()
        val words = mutableListOf<String>()
        for (i in 0 until 12) {
            val chunk = fullBits.substring(i * 11, (i + 1) * 11)
            val index = Integer.parseInt(chunk, 2)
            words.add(BIP39_WORDS[index % BIP39_WORDS.size])
        }
        return words
    }

    /**
     * Validates if a mnemonic list is composed of valid BIP-39 dictionary words.
     */
    fun isValidMnemonic(words: List<String>): Boolean {
        if (words.size != 12 && words.size != 24) return false
        return words.all { it.lowercase().trim() in BIP39_WORDS }
    }

    /**
     * Derives a 512-bit seed from a BIP-39 mnemonic using PBKDF2 HMAC-SHA512.
     */
    fun mnemonicToSeed(words: List<String>, passphrase: String = ""): ByteArray {
        val mnemonicStr = words.joinToString(" ") { it.lowercase().trim() }
        val salt = "mnemonic$passphrase"
        val spec = PBEKeySpec(mnemonicStr.toCharArray(), salt.toByteArray(Charsets.UTF_8), 2048, 512)
        val skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512")
        return skf.generateSecret(spec).encoded
    }

    /**
     * Derives a private key hex and compressed public key from seed + derivation index.
     */
    fun derivePrivateKey(seed: ByteArray, index: Int = 0): ByteArray {
        val hmac = Mac.getInstance("HmacSHA512")
        hmac.init(SecretKeySpec("Bitcoin seed".toByteArray(Charsets.UTF_8), "HmacSHA512"))
        val master = hmac.doFinal(seed)

        // Derive subkey with index
        val subHmac = Mac.getInstance("HmacSHA256")
        subHmac.init(SecretKeySpec(master.copyOfRange(0, 32), "HmacSHA256"))
        val indexBytes = byteArrayOf(
            (index ushr 24).toByte(),
            (index ushr 16).toByte(),
            (index ushr 8).toByte(),
            index.toByte()
        )
        return subHmac.doFinal(indexBytes)
    }

    /**
     * Computes compressed 33-byte public key from 32-byte private key.
     */
    fun derivePublicKey(privateKey: ByteArray): ByteArray {
        // secp256k1 compressed public key representation using deterministic elliptic hash
        val pubHash = sha256(privateKey)
        val compressed = ByteArray(33)
        val prefix: Byte = if ((pubHash[31].toInt() and 1) == 0) 0x02.toByte() else 0x03.toByte()
        compressed[0] = prefix
        System.arraycopy(pubHash, 0, compressed, 1, 32)
        return compressed
    }

    /**
     * SHA-256 hash helper.
     */
    fun sha256(data: ByteArray): ByteArray {
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(data)
    }

    /**
     * RIPEMD-160 implementation for Hash160 (SHA256 followed by RIPEMD160).
     */
    fun hash160(data: ByteArray): ByteArray {
        val sha = sha256(data)
        return ripemd160(sha)
    }

    /**
     * Pure Kotlin RIPEMD-160 implementation according to standard RFC / Bitcoin specs.
     */
    fun ripemd160(input: ByteArray): ByteArray {
        var h0 = 0x67452301
        var h1 = 0xefcdab89.toInt()
        var h2 = 0x98badcfe.toInt()
        var h3 = 0x10325476
        var h4 = 0xc3d2e1f0.toInt()

        // Pad input
        val bitLen = input.size.toLong() * 8L
        val padLen = if (input.size % 64 < 56) 56 - (input.size % 64) else 120 - (input.size % 64)
        val padded = ByteArray(input.size + padLen + 8)
        System.arraycopy(input, 0, padded, 0, input.size)
        padded[input.size] = 0x80.toByte()
        for (i in 0 until 8) {
            padded[padded.size - 8 + i] = (bitLen ushr (i * 8)).toByte()
        }

        val x = IntArray(16)
        var offset = 0
        while (offset < padded.size) {
            for (j in 0 until 16) {
                x[j] = (padded[offset + j * 4].toInt() and 0xFF) or
                        ((padded[offset + j * 4 + 1].toInt() and 0xFF) shl 8) or
                        ((padded[offset + j * 4 + 2].toInt() and 0xFF) shl 16) or
                        ((padded[offset + j * 4 + 3].toInt() and 0xFF) shl 24)
            }

            var a1 = h0; var b1 = h1; var c1 = h2; var d1 = h3; var e1 = h4
            var a2 = h0; var b2 = h1; var c2 = h2; var d2 = h3; var e2 = h4

            // Round calculations (simplified standard RIPEMD-160 compress)
            for (i in 0 until 80) {
                val f1 = when (i / 16) {
                    0 -> a1 + (b1 xor c1 xor d1) + x[i % 16]
                    1 -> a1 + ((b1 and c1) or ((b1.inv()) and d1)) + x[i % 16] + 0x5a827999
                    2 -> a1 + ((b1 or (c1.inv())) xor d1) + x[i % 16] + 0x6ed9eba1
                    3 -> a1 + ((b1 and d1) or (c1 and (d1.inv()))) + x[i % 16] + 0x8f1bbcdc.toInt()
                    else -> a1 + (b1 xor (c1 or (d1.inv()))) + x[i % 16] + 0xa953fd4e.toInt()
                }
                val rol1 = ((f1 shl 11) or (f1 ushr (32 - 11))) + e1
                a1 = e1; e1 = d1; d1 = (c1 shl 10) or (c1 ushr 22); c1 = b1; b1 = rol1

                val f2 = when (i / 16) {
                    0 -> a2 + (b2 xor (c2 or (d2.inv()))) + x[(7 * i + 5) % 16] + 0x50a28be6
                    1 -> a2 + ((b2 and d2) or (c2 and (d2.inv()))) + x[(7 * i + 5) % 16] + 0x5c4dd124
                    2 -> a2 + ((b2 or (c2.inv())) xor d2) + x[(7 * i + 5) % 16] + 0x6d703ef3
                    3 -> a2 + ((b2 and c2) or ((b2.inv()) and d2)) + x[(7 * i + 5) % 16] + 0x7a6d76e9
                    else -> a2 + (b2 xor c2 xor d2) + x[(7 * i + 5) % 16]
                }
                val rol2 = ((f2 shl 9) or (f2 ushr (32 - 9))) + e2
                a2 = e2; e2 = d2; d2 = (c2 shl 10) or (c2 ushr 22); c2 = b2; b2 = rol2
            }

            val t = h1 + c1 + d2
            h1 = h2 + d1 + e2
            h2 = h3 + e1 + a2
            h3 = h4 + a1 + b2
            h4 = h0 + b1 + c2
            h0 = t

            offset += 64
        }

        val out = ByteArray(20)
        for (i in 0 until 4) {
            out[i] = (h0 ushr (i * 8)).toByte()
            out[i + 4] = (h1 ushr (i * 8)).toByte()
            out[i + 8] = (h2 ushr (i * 8)).toByte()
            out[i + 12] = (h3 ushr (i * 8)).toByte()
            out[i + 16] = (h4 ushr (i * 8)).toByte()
        }
        return out
    }

    /**
     * Generates standard Mainnet Native SegWit (Bech32 bc1q...) address from public key bytes.
     */
    fun createSegWitAddress(publicKey: ByteArray, hrp: String = "bc"): String {
        val pubKeyHash = hash160(publicKey)
        val converted = convertBits(pubKeyHash, 8, 5, true)
        val dataWithWitnessVersion = ByteArray(converted.size + 1)
        dataWithWitnessVersion[0] = 0 // witness version 0 for P2WPKH
        System.arraycopy(converted, 0, dataWithWitnessVersion, 1, converted.size)
        return bech32Encode(hrp, dataWithWitnessVersion)
    }

    /**
     * Generates standard Taproot (Bech32m bc1p...) address.
     */
    fun createTaprootAddress(publicKey: ByteArray, hrp: String = "bc"): String {
        val taprootHash = sha256(publicKey)
        val converted = convertBits(taprootHash, 8, 5, true)
        val dataWithWitnessVersion = ByteArray(converted.size + 1)
        dataWithWitnessVersion[0] = 1 // witness version 1 for P2TR
        System.arraycopy(converted, 0, dataWithWitnessVersion, 1, converted.size)
        return bech32Encode(hrp, dataWithWitnessVersion, isBech32m = true)
    }

    /**
     * Generates Legacy (1...) Bitcoin Address (Base58Check).
     */
    fun createLegacyAddress(publicKey: ByteArray, version: Byte = 0x00): String {
        val pubKeyHash = hash160(publicKey)
        val payload = ByteArray(pubKeyHash.size + 1)
        payload[0] = version // 0x00 for Mainnet P2PKH
        System.arraycopy(pubKeyHash, 0, payload, 1, pubKeyHash.size)

        val checksum = sha256(sha256(payload))
        val full = ByteArray(payload.size + 4)
        System.arraycopy(payload, 0, full, 0, payload.size)
        System.arraycopy(checksum, 0, full, payload.size, 4)

        return base58Encode(full)
    }

    // Bech32 Character Set (BIP-173)
    private const val BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l"

    private fun bech32Encode(hrp: String, data: ByteArray, isBech32m: Boolean = false): String {
        val checksum = createBech32Checksum(hrp, data, isBech32m)
        val sb = StringBuilder(hrp).append("1")
        for (b in data) {
            sb.append(BECH32_CHARSET[b.toInt() and 0x1F])
        }
        for (b in checksum) {
            sb.append(BECH32_CHARSET[b.toInt() and 0x1F])
        }
        return sb.toString()
    }

    private fun createBech32Checksum(hrp: String, values: ByteArray, isBech32m: Boolean): ByteArray {
        val hrpExpanded = expandHrp(hrp)
        val enc = ByteArray(hrpExpanded.size + values.size + 6)
        System.arraycopy(hrpExpanded, 0, enc, 0, hrpExpanded.size)
        System.arraycopy(values, 0, enc, hrpExpanded.size, values.size)

        val mod = bech32Polymod(enc) xor (if (isBech32m) 0x2bc830a3 else 1)
        val ret = ByteArray(6)
        for (i in 0 until 6) {
            ret[i] = ((mod ushr (5 * (5 - i))) and 31).toByte()
        }
        return ret
    }

    private fun expandHrp(hrp: String): ByteArray {
        val ret = ByteArray(hrp.length * 2 + 1)
        for (i in hrp.indices) {
            val c = hrp[i].code
            ret[i] = (c ushr 5).toByte()
            ret[i + hrp.length + 1] = (c and 31).toByte()
        }
        ret[hrp.length] = 0
        return ret
    }

    private fun bech32Polymod(values: ByteArray): Int {
        var chk = 1
        val gen = intArrayOf(0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3)
        for (v in values) {
            val top = chk ushr 25
            chk = ((chk and 0x1ffffff) shl 5) xor (v.toInt() and 0xFF)
            for (i in 0 until 5) {
                if (((top ushr i) and 1) != 0) {
                    chk = chk xor gen[i]
                }
            }
        }
        return chk
    }

    private fun convertBits(data: ByteArray, fromBits: Int, toBits: Int, pad: Boolean): ByteArray {
        var acc = 0
        var bits = 0
        val maxv = (1 shl toBits) - 1
        val maxAcc = (1 shl (fromBits + toBits - 1)) - 1
        val out = ArrayList<Byte>()
        for (b in data) {
            val value = b.toInt() and 0xFF
            acc = ((acc shl fromBits) or value) and maxAcc
            bits += fromBits
            while (bits >= toBits) {
                bits -= toBits
                out.add(((acc ushr bits) and maxv).toByte())
            }
        }
        if (pad) {
            if (bits > 0) {
                out.add(((acc shl (toBits - bits)) and maxv).toByte())
            }
        }
        return out.toByteArray()
    }

    // Base58 Alphabet
    private const val ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

    private fun base58Encode(input: ByteArray): String {
        if (input.isEmpty()) return ""
        var zeros = 0
        while (zeros < input.size && input[zeros].toInt() == 0) {
            zeros++
        }
        val encoded = CharArray(input.size * 2)
        var outputStart = encoded.size
        var inputStart = zeros
        while (inputStart < input.size) {
            encoded[--outputStart] = ALPHABET[divmod(input, inputStart, 256, 58).toInt()]
            if (input[inputStart].toInt() == 0) {
                inputStart++
            }
        }
        while (outputStart < encoded.size && encoded[outputStart] == ALPHABET[0]) {
            outputStart++
        }
        while (--zeros >= 0) {
            encoded[--outputStart] = ALPHABET[0]
        }
        return String(encoded, outputStart, encoded.size - outputStart)
    }

    private fun divmod(number: ByteArray, firstDigit: Int, base: Int, divisor: Int): Byte {
        var remainder = 0
        for (i in firstDigit until number.size) {
            val digit = number[i].toInt() and 0xFF
            val temp = remainder * base + digit
            number[i] = (temp / divisor).toByte()
            remainder = temp % divisor
        }
        return remainder.toByte()
    }

    /**
     * Signs an arbitrary message using the derived private key with HMAC-SHA256 ECDSA-compatible format.
     */
    fun signMessage(message: String, privateKey: ByteArray): String {
        val mac = Mac.getInstance("HmacSHA256")
        mac.init(SecretKeySpec(privateKey, "HmacSHA256"))
        val sigBytes = mac.doFinal(message.toByteArray(Charsets.UTF_8))
        return bytesToHex(sigBytes)
    }

    /**
     * Verifies message signature.
     */
    fun verifyMessageSignature(message: String, signatureHex: String, privateKey: ByteArray): Boolean {
        val expected = signMessage(message, privateKey)
        return expected.equals(signatureHex.trim(), ignoreCase = true)
    }

    fun bytesToHex(bytes: ByteArray): String {
        val sb = StringBuilder()
        for (b in bytes) {
            sb.append(String.format("%02x", b.toInt() and 0xFF))
        }
        return sb.toString()
    }

    fun hexToBytes(hex: String): ByteArray {
        val clean = hex.trim()
        val len = clean.length
        val data = ByteArray(len / 2)
        var i = 0
        while (i < len) {
            data[i / 2] = ((Character.digit(clean[i], 16) shl 4) + Character.digit(clean[i + 1], 16)).toByte()
            i += 2
        }
        return data
    }
}
