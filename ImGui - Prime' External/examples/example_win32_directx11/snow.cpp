#include "snow.hpp"

Snowflake::vec3 gravity;

float min(float a, float b) { return (a < b) ? a : b; }
float max(float a, float b) { return (a > b) ? a : b; }

float Constrain(float n, float low, float high) {
    return max(min(n, high), low);
}

float Map(float n, float start1, float stop1, float start2, float stop2, bool withinBounds = false) {
    float newVal = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
    if (!withinBounds)
        return newVal;
    return Constrain(newVal, min(start2, stop2), max(start2, stop2));
}

float RandomFloat(float a, float b) {
    return a + (((float)rand()) / RAND_MAX) * (b - a);
}

float GetRandomSize(float min, float max) {
    float r = pow(RandomFloat(0.f, 1.f), 3);     
    return Constrain(r * max, min, max);
}

Snowflake::Snowflake::Snowflake(float _minSize, float _maxSize, int _windowX, int _windowY, int _width, int _height, ImU32 _color) {
    minSize = _minSize;
    maxSize = _maxSize;
    windowX = _windowX;
    windowY = _windowY;
    width = _width;
    height = _height;
    color = _color;

    pos = vec3(RandomFloat(windowX, windowX + width), RandomFloat(windowY - 100.f, windowY - 10.f));
    velocity = vec3(RandomFloat(-0.3f, 0.3f), RandomFloat(0.4f, 10.f));
    accelaretion = vec3();
    radius = GetRandomSize(minSize, maxSize);
}

void Snowflake::Snowflake::ApplyForce(vec3 force) {
    force = vec3(force.x * radius, force.y * radius, force.z * radius);    
    accelaretion = vec3(accelaretion.x + force.x, accelaretion.y + force.y, accelaretion.z + force.z);
}


void Snowflake::Snowflake::Update() {
    velocity += accelaretion;
    velocity.Limit((radius * 8.f) * 0.25f);    

    pos += velocity;
    accelaretion = vec3();

    if (OffScreen())
        Randomize();
}

void Snowflake::Snowflake::Render() {
    ImGui::GetWindowDrawList()->AddCircleFilled(ImVec2(pos.x, pos.y), radius, color);
    ImGui::GetWindowDrawList()->AddShadowCircle(ImVec2(pos.x, pos.y), radius, color, 30.f, ImVec2(0, 0), 0, 12);
}

bool Snowflake::Snowflake::OffScreen() {
    return pos.y > windowY + height + radius || pos.x < windowX - radius || pos.x > windowX + width + radius;
}

void Snowflake::Snowflake::Randomize() {
    pos = vec3(RandomFloat(windowX, windowX + width), RandomFloat(windowY - 100.f, windowY - 10.f));
    velocity = vec3(RandomFloat(-0.3f, 0.3f), RandomFloat(0.4f, 10.f));
    accelaretion = vec3();
    radius = GetRandomSize(minSize, maxSize);
}

bool Snowflake::Snowflake::operator==(const Snowflake& target) {
    return pos == target.pos && velocity == target.velocity && accelaretion == target.accelaretion && radius == target.radius;
}

void Snowflake::CreateSnowFlakes(std::vector<Snowflake>& snow, uint64_t limit, float _minSize, float _maxSize, int _windowX, int _windowY, int _width, int _height, vec3 _gravity, ImU32 _color) {
    gravity = _gravity;
    for (uint64_t i = 0; i < limit; i++) {
        snow.push_back(Snowflake(_minSize, _maxSize, _windowX, _windowY, _width, _height, _color));
    }
}

void Snowflake::Update(std::vector<Snowflake>& snow, vec3 mouse, vec3 windowPos) {
    static uint64_t flakesCreated = 0;
    static float timeSinceLastSpawn = 0.f;
    static float nextSpawnDelay = RandomFloat(0.005f, 0.05f);
    static const uint64_t snowflakeLimit = 30;

    mouse = vec3(mouse.x - windowPos.x, mouse.y - windowPos.y, mouse.z - windowPos.z);

    float deltaTime = ImGui::GetIO().DeltaTime;
    timeSinceLastSpawn += deltaTime;

    while (flakesCreated < snowflakeLimit && timeSinceLastSpawn >= nextSpawnDelay) {
        snow.emplace_back(1.5f, 3.5f, 0, 0, 800, 600, IM_COL32(255, 255, 255, 255));
        flakesCreated++;
        timeSinceLastSpawn -= nextSpawnDelay;
        nextSpawnDelay = RandomFloat(0.005f, 0.05f);
    }

    for (Snowflake& flake : snow) {
        float xOff = flake.pos.x / (flake.windowX + flake.width);
        float yOff = flake.pos.y / (flake.windowY + flake.height);

        float wx = Map(mouse.x - flake.windowX, 0, flake.width, -0.003f, 0.003f, true);
        vec3 wind(wx + xOff * 0.002f, yOff * 0.002f);
        wind *= 0.5f;

        vec3 variedGravity = gravity;
        variedGravity.x += RandomFloat(-0.0005f, 0.0005f);
        variedGravity.y += RandomFloat(-0.001f, 0.05f);

        flake.ApplyForce(variedGravity);
        flake.ApplyForce(wind);
        flake.Update();
        flake.Render();
    }
}

void Snowflake::ChangeWindowPos(std::vector<Snowflake>& snow, int _windowX, int _windowY) {
    for (Snowflake& flake : snow) {
        flake.pos.x += _windowX - flake.windowX;
        flake.pos.y += _windowY - flake.windowY;
        flake.windowX = _windowX;
        flake.windowY = _windowY;
    }
}
